// server.cpp
#include "crow_all.h"
#include "symspell.h"

#include <curl/curl.h>
#include <cstdlib>
#include <string>

// ========== CORS MIDDLEWARE ==========
struct CORSMiddleware {
    struct context {};

    // We don’t need to do anything before the handler
    void before_handle(crow::request&, crow::response&, context&) {}

    // after_handle sees the response returned by your route
    void after_handle(crow::request&, crow::response& res, context&) {
        res.add_header("Access-Control-Allow-Origin",  "*");
        res.add_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.add_header("Access-Control-Allow-Headers", "Content-Type");
    }
};

// ========== libcurl WRITE CALLBACK ==========
static size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    auto* s = static_cast<std::string*>(userp);
    s->append(static_cast<char*>(contents), size * nmemb);
    return size * nmemb;
}

int main() {
    // 1) Initialize libcurl
    curl_global_init(CURL_GLOBAL_DEFAULT);

    // 2) Use App with our CORS middleware
    crow::App<CORSMiddleware> app;
    SymSpell spell_checker(2);
    spell_checker.load_dictionary("./data/count_1w100k.txt");

    // ── Root ──────────────────────────────────────────────────────────────────
    CROW_ROUTE(app, "/")([](){
        return "Hello, Crow!";
    });

    // ── Spellcheck ────────────────────────────────────────────────────────────
    CROW_ROUTE(app, "/spellcheck")
    .methods(crow::HTTPMethod::GET, crow::HTTPMethod::OPTIONS)
    ([&spell_checker](const crow::request& req){
        if (req.method == crow::HTTPMethod::OPTIONS) {
            return crow::response(204);
        }

        auto word_param = req.url_params.get("word");
        if (!word_param) {
            crow::json::wvalue err{{"error","No word provided"}};
            return crow::response(400, err.dump());
        }

        std::string word = word_param;
        auto suggestions = spell_checker.lookup(word);

        crow::json::wvalue jsonRes;
        jsonRes["input"] = word;
        crow::json::wvalue::list suggestion_list;
        for (const auto& s : suggestions) {
            crow::json::wvalue obj;
            obj["word"]          = s.first;
            obj["edit_distance"] = s.second;
            obj["frequency"]     = spell_checker.dictionary[s.first];
            suggestion_list.push_back(obj);
        }
        jsonRes["suggestions"] = std::move(suggestion_list);
        return crow::response(200, jsonRes.dump());
    });

    // ── Rewrite ───────────────────────────────────────────────────────────────
    CROW_ROUTE(app, "/rewrite")
    .methods(crow::HTTPMethod::POST, crow::HTTPMethod::OPTIONS)
    ([](const crow::request& req){
        if (req.method == crow::HTTPMethod::OPTIONS) {
            return crow::response(204);
        }

        auto js = crow::json::load(req.body);
        if (!js || !js.has("text")) {
            crow::json::wvalue err{{"error","Missing 'text' field"}};
            return crow::response(400, err.dump());
        }
        std::string userText = js["text"].s();

        const char* key = std::getenv("OPENAI_API_KEY");
        if (!key) {
            crow::json::wvalue err{{"error","OPENAI_API_KEY not set"}};
            return crow::response(500, err.dump());
        }

        // Build payload
        crow::json::wvalue payload;
        payload["model"] = "gpt-3.5-turbo";
        payload["messages"] = crow::json::wvalue::list({
            crow::json::wvalue({{"role","system"},{"content","Please rewrite the following text to improve clarity and style."}}),
            crow::json::wvalue({{"role","user"},{"content", userText}})
        });
        payload["temperature"] = 0.7;
        payload["max_tokens"]  = 512;
        std::string body = payload.dump();

        // Call OpenAI via libcurl
        CURL* curl = curl_easy_init();
        std::string response_string;
        long http_code = 0;
        if (curl) {
            struct curl_slist* headers = nullptr;
            headers = curl_slist_append(headers, "Content-Type: application/json");
            headers = curl_slist_append(headers, (std::string("Authorization: Bearer ") + key).c_str());

            curl_easy_setopt(curl, CURLOPT_URL,            "https://api.openai.com/v1/chat/completions");
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER,     headers);
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS,     body.c_str());
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION,  WriteCallback);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA,      &response_string);

            if (curl_easy_perform(curl) == CURLE_OK) {
                curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
            }
            curl_slist_free_all(headers);
            curl_easy_cleanup(curl);
        }

        if (http_code != 200) {
            crow::json::wvalue err{{"error","OpenAI request failed"},{"status",std::to_string(http_code)}};
            return crow::response(500, err.dump());
        }

        // Parse
        auto openai = crow::json::load(response_string);
        std::string rewritten;
        try { rewritten = openai["choices"][0]["message"]["content"].s(); }
        catch(...) { rewritten = userText; }

        crow::json::wvalue out;
        out["rewritten"] = rewritten;
        return crow::response(200, out.dump());
    });

    // ── Launch ────────────────────────────────────────────────────────────────
    app.port(8080).multithreaded().run();

    // Cleanup
    curl_global_cleanup();
    return 0;
}