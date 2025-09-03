document.addEventListener('DOMContentLoaded', () => {
    let correctWord = '';
    let wordList = [];
    const maxGuesses = 6;
    const wordLength = 5;

    let currentGuess = "";
    let currentRow = 0;
    let gameOver = false;
    let isSettingWord = false; // New state variable

    const board = document.getElementById('board');
    const messageBox = document.getElementById('message-box');
    const keys = document.querySelectorAll('.key');
    const newGameBtn = document.getElementById('new-game-btn');

    const wordListUrl = "https://gist.githubusercontent.com/dracos/dd0668f281e685bad51479e5acaadb93/raw/6bfa15d263d6d5b63840a8e5b64e04b382fdb079/valid-wordle-words.txt";

    // --- Game Setup and Initialization ---

    function createBoard() {
        board.innerHTML = '';
        for (let i = 0; i < maxGuesses; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            for (let j = 0; j < wordLength; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                const tileFront = document.createElement('div');
                tileFront.className = 'tile-inner tile-front';
                const tileBack = document.createElement('div');
                tileBack.className = 'tile-inner tile-back';
                tile.appendChild(tileFront);
                tile.appendChild(tileBack);
                row.appendChild(tile);
            }
            board.appendChild(row);
        }
    }

    // Fisher-Yates shuffle algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    async function initGame() {
        showMessage("Loading word...");
        resetGameState();
        try {
            const response = await fetch(wordListUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const wordListText = await response.text();
            const words = wordListText.trim().split('\n').map(word => word.toUpperCase());
            
            if (words.length > 0) {
                shuffleArray(words);
                correctWord = words[0];
                wordList = words;
                createBoard();
                showMessage("");
            } else {
                throw new Error("Word list is empty.");
            }
        } catch (error) {
            console.error("Failed to fetch word list:", error);
            showMessage("Failed to load game. Check console for details.");
        }
    }
    
    function resetGameState() {
        currentGuess = "";
        currentRow = 0;
        gameOver = false;
        isSettingWord = false; // Reset state
        
        keys.forEach(key => {
            key.classList.remove('absent', 'present', 'correct');
        });
    }

    function updateBoard() {
        const row = board.children[currentRow];
        for (let i = 0; i < wordLength; i++) {
            const tile = row.children[i];
            const tileFront = tile.querySelector('.tile-front');
            if (currentGuess.length > i) {
                tileFront.textContent = currentGuess[i];
                tile.classList.add('filled');
            } else {
                tileFront.textContent = '';
                tile.classList.remove('filled');
            }
        }
    }

    function showMessage(message) {
        messageBox.textContent = message;
        setTimeout(() => {
            messageBox.textContent = '';
        }, 2000);
    }

    function updateKeyColor(letter, status) {
        const key = document.querySelector(`.key[data-key="${letter.toLowerCase()}"]`);
        if (!key) return;
        
        if (key.classList.contains('correct')) {
            return;
        }
        if (key.classList.contains('present') && status !== 'correct') {
            return;
        }
        
        key.classList.add(status);
    }
    
    function updateKeysOnWin() {
        for (const letter of correctWord) {
            const key = document.querySelector(`.key[data-key="${letter.toLowerCase()}"]`);
            if (key) {
                key.classList.remove('absent', 'present');
                key.classList.add('correct');
            }
        }
    }
    
    // --- Game Logic Functions ---
    
    async function checkGuess() {
        // Handle admin command to show the word
        if (currentGuess === "BLANB") {
            showMessage(`The word is: ${correctWord}.`);
            currentGuess = ""; 
            updateBoard();
            return;
        }

        // Handle admin command to set a new word
        if (currentGuess === "BLANC") {
            isSettingWord = true;
            currentGuess = "";
            updateBoard();
            showMessage("Type to set new word.");
            return;
        }

        if (currentGuess.length !== wordLength) {
            showMessage("Not enough letters.");
            return;
        }
        
        if (!wordList.includes(currentGuess)) {
            showMessage("Not a valid word.");
            return;
        }
        
        const guess = currentGuess;
        const row = board.children[currentRow];
        const correctWordLetters = correctWord.split('');
        const guessLetters = guess.split('');

        // Mark correct tiles and keys
        for (let i = 0; i < wordLength; i++) {
            const tileBack = row.children[i].querySelector('.tile-back');
            tileBack.textContent = guessLetters[i];
            if (guessLetters[i] === correctWordLetters[i]) {
                setTimeout(() => {
                    row.children[i].classList.add('flip', 'correct');
                    updateKeyColor(guessLetters[i], 'correct');
                }, i * 200);
                correctWordLetters[i] = null;
                guessLetters[i] = null;
            }
        }

        // Mark present and absent tiles and keys
        for (let i = 0; i < wordLength; i++) {
            const tile = row.children[i];
            const tileBack = tile.querySelector('.tile-back');
            if (guessLetters[i] === null) continue;

            tileBack.textContent = guessLetters[i];
            if (correctWordLetters.includes(guessLetters[i])) {
                setTimeout(() => {
                    tile.classList.add('flip', 'present');
                    updateKeyColor(guessLetters[i], 'present');
                }, i * 200);
                const index = correctWordLetters.indexOf(guessLetters[i]);
                correctWordLetters[index] = null;
            } else {
                setTimeout(() => {
                    tile.classList.add('flip', 'absent');
                    updateKeyColor(guessLetters[i], 'absent');
                }, i * 200);
            }
        }
        
        // Check win/loss
        if (guess === correctWord) {
            gameOver = true;
            setTimeout(() => {
                updateKeysOnWin();
                showMessage("You won! 🎉");
            }, wordLength * 200);
        } else if (currentRow === maxGuesses - 1) {
            gameOver = true;
            showMessage(`Game Over! The word was ${correctWord}.`);
        } else {
            currentRow++;
            currentGuess = "";
        }
    }

    function setNewWord() {
        if (currentGuess.length === wordLength && wordList.includes(currentGuess)) {
            correctWord = currentGuess;
            
            // This is the key change: clear the current guess, but don't reset the game
            currentGuess = "";
            updateBoard(); 
            isSettingWord = false; // Turn off the "set word" mode
            showMessage(`New word set to: ${correctWord}`);
        } else {
            showMessage("Invalid word. It must be 5 letters and in the word list.");
            currentGuess = "";
            updateBoard();
            isSettingWord = false; // Turn off the "set word" mode on invalid input
        }
    }

    // --- Event Listeners ---
    
    function handleKeyDown(event) {
        if (gameOver) return;
        
        const key = event.key.toUpperCase();
        
        if (key === 'ENTER') {
            if (isSettingWord) {
                setNewWord();
            } else {
                checkGuess();
            }
        } else if (key === 'BACKSPACE') {
            currentGuess = currentGuess.slice(0, -1);
        } else if (key.length === 1 && key.match(/[A-Z]/)) {
            if (currentGuess.length < wordLength) {
                currentGuess += key;
            }
        }
        updateBoard();
    }

    keys.forEach(key => {
        key.addEventListener('click', () => {
            const keyChar = key.dataset.key;
            if (keyChar === 'enter') {
                handleKeyDown({ key: 'Enter' });
            } else if (keyChar === 'backspace') {
                handleKeyDown({ key: 'Backspace' });
            } else {
                handleKeyDown({ key: keyChar.toUpperCase() });
            }
        });
    });

    newGameBtn.addEventListener('click', () => {
        initGame();
    });

    initGame();
    document.addEventListener('keydown', handleKeyDown);
});