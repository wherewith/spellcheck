#include "crow_all.h"
#include "symspell.h"

int main()
{
    crow::SimpleApp app;
    SymSpell spell_checker(2);

    spell_checker.load_dictionary("./data/count_1w100k.txt");

    CROW_ROUTE(app, "/")([]()
                         { return "Hello, Crow!"; });

    // This route now handles both GET and OPTIONS methods for CORS.
    CROW_ROUTE(app, "/spellcheck")
        .methods(crow::HTTPMethod::GET, crow::HTTPMethod::OPTIONS)([&spell_checker](const crow::request &req)
                                                                   {
        // Handle preflight OPTIONS request
        if(req.method == crow::HTTPMethod::OPTIONS) {
            crow::response res;
            res.add_header("Access-Control-Allow-Origin", "*");
            res.add_header("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.add_header("Access-Control-Allow-Headers", "Content-Type");
            res.code = 200;
            return res;
        }

        crow::json::wvalue jsonRes;
        auto word_param = req.url_params.get("word");
        if (!word_param) {
            jsonRes["error"] = "No word provided";
            crow::response r(400, jsonRes);
            r.add_header("Access-Control-Allow-Origin", "*");
            return r;
        }

        std::string word = word_param;
        auto suggestions = spell_checker.lookup(word);

        if (suggestions.empty()) {
            jsonRes["input"] = word;
            jsonRes["suggestions"] = crow::json::wvalue::list();
            crow::response r(200, jsonRes);
            r.add_header("Access-Control-Allow-Origin", "*");
            return r;
        }

        crow::json::wvalue::list suggestion_list;
        for (const auto& suggestion : suggestions) {
            crow::json::wvalue suggestion_obj;
            suggestion_obj["word"] = suggestion.first;
            suggestion_obj["edit_distance"] = suggestion.second;
            suggestion_obj["frequency"] = spell_checker.dictionary[suggestion.first];
            suggestion_list.push_back(suggestion_obj);
        }

        jsonRes["input"] = word;
        jsonRes["suggestions"] = std::move(suggestion_list);
        crow::response r(200, jsonRes);
        r.add_header("Access-Control-Allow-Origin", "*");
        return r; });

    app.port(8080).multithreaded().run();
}