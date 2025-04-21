#ifndef SYMSPELL_H
#define SYMSPELL_H

#include <iostream>
#include <unordered_map>
#include <vector>
#include <string>
#include <fstream>
#include <algorithm>
#include <set>

class SymSpell {
    private:
        std::unordered_map<std::string, std::string> deletes;
        int max_edit_dist;
        int min_freq;
    public:
        std::unordered_map<std::string, int> dictionary;

        SymSpell(int max_edit_dist = 2, int min_freq = 1) : max_edit_dist(max_edit_dist), min_freq(min_freq) {}

        std::vector<std::string> generate_deletes(const std::string& word);

        std::vector<std::string> generate_delete_candidates(const std::string& word, int dist, std::set<std::string>& visited);

        void add_word(const std::string& word, int freq = 1);

        bool load_dictionary(const std::string& fn);

        int levenshtein_distance(const std::string& a, const std::string& b);

        int damerau_levenshtein_distance(const std::string& a, const std::string& b);

        std::vector<std::pair<std::string, int>> lookup(const std::string& word, int max_dist_lookup = -1);
};

#endif