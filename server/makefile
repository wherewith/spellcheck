CXX       = g++
CXXFLAGS  = -std=c++17 -I/opt/homebrew/include
LDFLAGS   = -L/opt/homebrew/lib
LDLIBS    = -lcurl -lpthread

SRC    := $(wildcard *.cpp)
OBJ    := $(SRC:.cpp=.o)
TARGET := spellchecker

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LDFLAGS) $(LDLIBS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(OBJ) $(TARGET)
