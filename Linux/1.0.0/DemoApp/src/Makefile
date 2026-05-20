TARGET = ../build/DemoApp
CC = g++
CFLAGS =
LDFLAGS = -ldotpad_sdk-1.0.0 -L../lib -pthread

SRCS = DemoApp.cpp
OBJS = $(SRCS:.cpp=.o)

# all
all: clean $(OBJS) $(TARGET)

# link
$(TARGET): $(OBJS)
	$(CC) -o $@ $^ $(LDFLAGS)

# compile 
.c.o:
	$(CC) -c -o $@ $< $(CFLAGS)

# delete
clean:
	-rm -f $(OBJS) $(TARGET)

