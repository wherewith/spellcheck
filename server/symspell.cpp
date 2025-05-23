#include "symspell.h"

/** 
 * Generates a list of all possible words that can be formed by deleting a single character of a given word.
 * @param word A word from which deletions are generated.
 * @return A vector of all words generated by deleting a single character of word.
*/
std::vector<std::string> SymSpell::generate_deletes(const std::string& word) {
    std::vector<std::string> result;
    
    for (size_t i = 0; i < word.length(); i++) {
        std::string temp = word;
        temp.erase(i, 1);
        result.push_back(temp);
    }
    
    return result;
}

/** 
 * Recursively generates a list of word variations by deleting up to a given number of characters
 * @param word A word from which word variations are generated.
 * @param dist How many characters to delete from word.
 * @param visited A set of words already processed in order to avoid duplicate generation
 * @return A vector of words generated by recursively deleting up to the given number of times
*/
std::vector<std::string> SymSpell::generate_delete_candidates(const std::string& word, int edit_dist, std::set<std::string>& visited) {
    std::vector<std::string> candidates;
            
    if (edit_dist > max_edit_dist) return candidates;
    
    std::vector<std::string> deletes = generate_deletes(word);
    
    for (const std::string& del : deletes) {
        if (visited.find(del) == visited.end()) {
            visited.insert(del);
            candidates.push_back(del);
            
            if (edit_dist < max_edit_dist) {
                std::vector<std::string> more_candidates = generate_delete_candidates(del, edit_dist + 1, visited);
                candidates.insert(candidates.end(), more_candidates.begin(), more_candidates.end());
            }
        }
    }
    
    return candidates;
}

/** 
 * Adds a given word and its frequency to the dictionary and generates deletion-based keys for lookup
 * @param word A word to add to the dictionary
 * @param freq The word's frequency (default value is 1)
*/
void SymSpell::add_word(const std::string& word, int freq) {
    dictionary[word] = freq;
            
    std::set<std::string> visited;
    std::vector<std::string> candidates = generate_delete_candidates(word, 1, visited);
    
    for (const std::string& candidate : candidates) {
        if (deletes.find(candidate) == deletes.end()) {
            deletes[candidate] = word;
        }
        else {
            if (dictionary[word] > dictionary[deletes[candidate]]) {
                deletes[candidate] = word;
            }
        }
    }
}

/** 
 * Loads words and their frequencies from a dictionary file specified by a given filename to the program's dictionary
 * @param fn Path to the dictionary file
 * @return true if loaded successfully, false if not
*/
bool SymSpell::load_dictionary(const std::string& fn) {
    std::ifstream file(fn);
    if (!file.is_open()) {
        std::cerr << "Could not open file: " << fn << std::endl;
        return false;
    } else {
        std::cout << "Loading dictionary from file: " << fn << std::endl;
    }
    
    std::string line;
    int count = 0;
    while (std::getline(file, line)) {
        // Find tab character
        size_t pos = line.find('\t');
        if (pos != std::string::npos) {
            // Extract word and convert to lowercase
            std::string word = line.substr(0, pos);
            std::transform(word.begin(), word.end(), word.begin(), ::tolower);
            
            // Extract frequency string
            std::string freq_str = line.substr(pos + 1);
            
            // Remove any non-digit characters
            freq_str.erase(std::remove_if(freq_str.begin(), freq_str.end(), 
                          [](char c) { return !std::isdigit(c); }), freq_str.end());
            
            // Convert to integer, handling large numbers
            int frequency;
            try {
                double full_freq = std::stod(freq_str);
                frequency = static_cast<int>(full_freq / 1000000); // Scale down by a million to prevent int overflow
                
                if (frequency < 1) frequency = 1;
                
                if (frequency >= min_freq) {
                    add_word(word, frequency);
                    count++;
                }
            } catch (const std::exception& e) {
                std::cerr << "Error parsing frequency for word '" << word 
                          << "': " << e.what() << std::endl;
            }
        }
    }
    
    file.close();
    std::cout << "Successfully loaded " << count << " words from dictionary." << std::endl;
    return true;
}

/**
 * Computes the Levenshtein distance between two strings (minimum number of single character insertions, deletions, or substitutions required to change one string into another)
 * @param a The first string to compare.
 * @param b The second string to compare
 */
int SymSpell::levenshtein_distance(const std::string& a, const std::string& b) {
    const int m = a.length();
    const int n = b.length();
    
    std::vector<std::vector<int>> dp(m + 1, std::vector<int>(n + 1));
    
    for (int i = 0; i <= m; i++) {
        for (int j = 0; j <= n; j++) {
            if (i == 0)
                dp[i][j] = j;
            
            else if (j == 0)
                dp[i][j] = i;
            
            else if (a[i - 1] == b[j - 1])
                dp[i][j] = dp[i - 1][j - 1];
            
            else
                dp[i][j] = 1 + std::min({dp[i][j - 1],
                                        dp[i - 1][j],
                                        dp[i - 1][j - 1]});
        }
    }
    
    return dp[m][n];
}

/**
 * Computes the Damerau-Levenshtein distance between two strings (minimum number of single character insertions, deletions, or substitutions required to change one string into another)
 * @param a The first string to compare.
 * @param b The second string to compare
 */
int SymSpell::damerau_levenshtein_distance(const std::string &a, const std::string &b) {
    const int m = a.length();
    const int n = b.length();
    std::vector<std::vector<int>> dp(m + 1, std::vector<int>(n + 1));

    for (int i = 0; i <= m; i++)
        dp[i][0] = i;
    for (int j = 0; j <= n; j++)
        dp[0][j] = j;

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            int cost = (a[i - 1] == b[j - 1]) ? 0 : 1;

            dp[i][j] = std::min({
                dp[i - 1][j] + 1, 
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            });

            if (i > 1 && j > 1 && a[i - 1] == b[j - 2] && a[i - 2] == b[j - 1]) {
                dp[i][j] = std::min(dp[i][j], dp[i - 2][j - 2] + cost); 
            }
        }
    }
    
    return dp[m][n];
}

/**
 * Finds spelling suggestions for a given word by searching for similar words within the dictionary.
 * @param word The input word to check
 * @param max_dist_lookup The maximum allowed edit distance for suggestions (default value is -1)
 * @return A vector of pairs consisting of {suggested word, edit distance from suggested word to word} sorted by edit distance and frequency
 */
std::vector<std::pair<std::string, int>> SymSpell::lookup(const std::string& word, int max_dist_lookup) {
    if (max_dist_lookup == -1) {
        max_dist_lookup = max_edit_dist;
    }
    
    std::vector<std::pair<std::string, int>> suggestions;
    
    // Check if the word exists in the dictionary
    if (dictionary.find(word) != dictionary.end()) {
        suggestions.push_back({word, 0});
        return suggestions;
    }
    
    // Generate all possible variations of the word
    std::set<std::string> visited;
    auto candidates = generate_delete_candidates(word, 1, visited);
    
    // Set to avoid duplicates in suggestions
    std::set<std::string> suggestion_set;
    
    // Check each candidate
    for (const auto& candidate : candidates) {
        // If the delete string exists in our mapping
        if (deletes.find(candidate) != deletes.end()) {
            std::string suggestion = deletes[candidate];
            
            // Already processed this suggestion
            if (suggestion_set.find(suggestion) != suggestion_set.end()) {
                continue;
            }
            
            suggestion_set.insert(suggestion);
            
            // Check if edit distance is within our threshold
            int dist = damerau_levenshtein_distance(word, suggestion);
            if (dist <= max_dist_lookup) {
                suggestions.push_back({suggestion, dist});
            }
        }
    }
    
    // Sort suggestions by edit distance and then by frequency
    std::sort(suggestions.begin(), suggestions.end(), 
             [this](const std::pair<std::string, int>& a, const std::pair<std::string, int>& b) {
                 if (a.second != b.second) {
                     return a.second < b.second; // Sort by edit distance
                 }
                 // If edit distances are the same, sort by frequency
                 return dictionary[a.first] > dictionary[b.first];
             });
    
    return suggestions;
}