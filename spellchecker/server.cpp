#include "crow_all.h"
#include "symspell.h"

int main() {
    crow::SimpleApp app;
    SymSpell spell_checker(2);

    spell_checker.load_dictionary("./data/count_1w100k.txt");

    CROW_ROUTE(app, "/")([](){
        return "Hello, Crow!";
    });

    CROW_ROUTE(app, "/spellcheck").methods(crow::HTTPMethod::GET)([&spell_checker](const crow::request& req) {
        crow::json::wvalue res;
        auto word_param = req.url_params.get("word");
        if (!word_param) {
            res["error"] = "No word provided";
        }

        std::string word = word_param;
        auto suggestions = spell_checker.lookup(word);

        if (suggestions.empty()) {
            res["input"] = word;
            res["suggestions"] = crow::json::wvalue::list();
            return crow::response(200, res);
        }

        crow::json::wvalue::list suggestion_list;
        for (const auto& suggestion : suggestions) {
            crow::json::wvalue suggestion_obj;
            suggestion_obj["word"] = suggestion.first;
            suggestion_obj["edit_distance"] = suggestion.second;
            suggestion_obj["frequency"] = spell_checker.dictionary[suggestion.first];
            suggestion_list.push_back(suggestion_obj);
        }

        res["input"] = word;
        res["suggestions"] = std::move(suggestion_list);

        return crow::response(200, res);
    });

    app.port(8080).multithreaded().run();
}