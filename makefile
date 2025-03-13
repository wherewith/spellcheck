CXX = g++
CXXFLAGS = -std=c++17 -I./include
LDFLAGS = -lpthread

SRC = $(wildcard *.cpp)
OBJ = $(SRC:.cpp=.o)
TARGET = spellchecker

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(OBJ) $(TARGET)
