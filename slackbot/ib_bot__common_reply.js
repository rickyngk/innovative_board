module.exports = function () {
    return {
        input: {
            "hello": "say_hello",
            "hi": "say_hello",
            "hey": "say_hello",
            "halo": "say_hello",
            "chao": "say_hello",
            "xin chao": "say_hello",
            "good morning": "say_hello",
            "good afternoon": "say_hello",
            "good evening": "say_hello",
            "morning": "say_hello",
            "yo": "say_hello",
            "howdy": "say_hello",
            "hiya": "say_hello_response",

            "i love you": "say_love",
            "love you": "say_love",
            "love": "say_love"
        },
        response: {
            "say_hello": [
                "Hello #user, how are you?",
                "Hi #user, how’s it going?",
                "Hi #user, what’s going on?",
                "Hi #user, nice to see you.",
                "G’day mate",
            ],
            "say_hello_response": [
                "Hi #user, I'm fine. And you?",
                "G’day mate",
                "Hi #user, nice to see you."
            ],
            "say_love": [
                "So sweet. I love you too",
                "You take my breath away",
                "It's awesome to spend my life with you!",
                "I adore you",
                "We were made for each other!",
                "You're one hot babe!",
                "The best thing in life is spelled Y-O-U!",
                "You turn me on!"
            ],
            "nothing_to_say": [
                ":D",
                ":scream_cat:",
                ":smirk:",
                ":hushed:",
                ":confused:"
            ]
        }
    }
}
