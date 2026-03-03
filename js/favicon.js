document.addEventListener("DOMContentLoaded", function () {
    const totalIcons = 42;      // Number of frames
    const intervalTime = 100;  // Speed (ms)

    let currentIndex = 1;

    function setFavicon(index) {
        // Remove existing favicon if it exists
        const existingIcon = document.querySelector("link[rel*='icon']");
        if (existingIcon) {
            existingIcon.remove();
        }

        // Create new favicon element
        const newIcon = document.createElement("link");
        newIcon.rel = "icon";
        newIcon.type = "image/png";
        newIcon.href = `https://raw.githubusercontent.com/banekondic1996/banekondic1996.github.io/refs/heads/main/icons/${index}.png`; // cache buster

        document.head.appendChild(newIcon);
    }

    const intervalId = setInterval(() => {
        setFavicon(currentIndex);
        if (currentIndex >= totalIcons) {
            clearInterval(intervalId); 
            console.log("Animation finished");
            return;
        }

        currentIndex++;
    }, intervalTime);
});