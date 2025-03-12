#include "symspell.h"

int main() {
    SymSpell spell_checker(2);
    
    // Add words to the dictionary
    // spell_checker.add_word("hello", 100);
    // spell_checker.add_word("world", 90);
    // spell_checker.add_word("help", 80);
    // spell_checker.add_word("held", 70);
    // spell_checker.add_word("test", 60);
    // spell_checker.add_word("testing", 50);
    
    spell_checker.load_dictionary("count_1w100k.txt");
    
    std::string input;
    std::cout << "Enter a word (or 'exit' to quit): ";
    while (std::cin >> input && input != "exit") {
        if (input.empty()) {
            std::cout << "Please enter a word: ";
            continue;
        }
        
        auto suggestions = spell_checker.lookup(input);
        
        if (suggestions.empty()) {
            std::cout << "No suggestions found for '" << input << "'" << std::endl;
        } else {
            std::cout << "Suggestions for '" << input << "':" << std::endl;
            for (const auto& suggestion : suggestions) {
                std::cout << "  " << suggestion.first 
                          << " (edit distance: " << suggestion.second 
                          << ", frequency: " << spell_checker.dictionary[suggestion.first] << ")" << std::endl;
            }
        }
        
        std::cout << "\nEnter a word (or 'exit' to quit): ";
    }
    
    return 0;
}