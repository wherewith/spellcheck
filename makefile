CXX = g++
CXXFLAGS = -std=c++17
SRC = $(wildcard *.cpp)
OBJ = $(SRC:.cpp=.o)
TARGET = spellchecker

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CXX) $(CXXFLAGS) -o $@ $^

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJ) $(TARGET)
