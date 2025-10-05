const fileInput = document.getElementById("file-input");
const addFileBtn = document.getElementById("add-file-btn");

// Minimal file upload event
addFileBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  const previewArea = document.getElementById("file-preview-area");
  previewArea.innerHTML = "";
  if (!file) return;

 const reader = new FileReader();

    reader.onload = (e) => {
userData.file = {
  fileName: file.name,
  mimeType: file.type,
  data: e.target.result.split(",")[1],
  isImage: file.type.startsWith("image/")
}
        if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.style.maxWidth = "100px";
      img.style.maxHeight = "100px";
      previewArea.appendChild(img);
    }
     
  else if(file.type=== "application/pdf") {
    const pdfEmbed = document.createElement("embed");
    pdfEmbed.src = fileData;
    pdfEmbed.type = "application/pdf";
    pdfEmbed.width = "400px"
    pdfEmbed.height = "500px";
    previewArea.appendChild(pdfEmbed);
  }
  else {
    const fileInfo = document.createElement("div");
    fileInfo.textContent = `Selected file: ${file.name}`;
    previewArea.appendChild(fileInfo);
  }
}
   reader.readAsDataURL(file);
  fileInput.value = "";
});

const container = document.querySelector(".container")
const chatsContainer = document.querySelector(".chats-container")
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
// File upload elements removed
const themeToggle = document.querySelector("#theme-toggle-btn")

const API_KEY = "AIzaSyCjmXRoupVP5-jEeSDjiTbjZeeii1RyQFY"
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

let typingInterval, controller;
const chatHistory = [];
const userData = { message: "", file: {} };

const createMsgElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}

const scrollToBottom = () => container.scrollTo({top: container.scrollHeight, behaviour: "smooth"});

const typingEffect = (text, textElement, botMsgDiv) => {

  textElement.textContent = "";
  const words = text.split(" ");
  let wordIndex = 0;

  typingInterval = setInterval(() => {
  if(wordIndex < words.length) {
    textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++]
   
    scrollToBottom();
  } else {
    clearInterval(typingInterval)
     botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
  }
  }, 40);
}

const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();

  chatHistory.push({
  role: "user",
  parts: [{text: userData.message }, ...(userData.file.data ? [{inline_data: (({fileName, isImage, ...rest }) => rest)(userData.file) }] : [])]
  });
  try {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {"Content-Type" : "application/json"},
    body: JSON.stringify({contents: chatHistory}),
    signal: controller.signal
  });

  const data = await response.json();
  if(!response.ok) throw new Error(data.error.message);
  
  const responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
  //textElement.textContent = responseText;
   typingEffect(responseText, textElement, botMsgDiv);
  
   chatHistory.push({role: "model",  parts: [{text: responseText } ]});
   
  } catch(error) {
    textElement.style.color = "#d62939"
    textElement.textContent = error.name === "AbortError" ? "Response generation stopped." : error.message;
     botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
  } finally {
    userData.file = {};
  }
}

const handleFormSubmit = (e) => {
  e.preventDefault();
 const userMessage = promptInput.value.trim();
  if(!userMessage || document.body.classList.contains("bot-responding")) return;

  promptInput.value = "";
  userData.message = userMessage;
  document.body.classList.add("bot-responding", "chats-active");
  // fileUploadWrapper removed

  const userMsgHTML = 
  `<p class="message-text"></p>`;


  const userMsgDiv = createMsgElement(userMsgHTML, "user-message");

  userMsgDiv.querySelector(".message-text").textContent = userMessage;
  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();

  setTimeout(() => {
    const botMsgHTML = `<img src="sparkle.png" class="avatar"><p class="message-text">Just a sec..</p>`
    const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);
    scrollToBottom();
    generateResponse(botMsgDiv);
  }, 600);
  }

// File upload event listeners removed


   document.querySelector("#stop-response-btn").addEventListener("click", () => {
    controller?.abort();
    clearInterval(typingInterval);
    const loadingMsg = chatsContainer.querySelector(".bot-message.loading");
    if (loadingMsg) loadingMsg.classList.remove("loading");
    document.body.classList.remove("bot-responding");
  });

   document.querySelector("#delete-chats-btn").addEventListener("click", () => {
   chatHistory.length = 0;
   chatsContainer.innerHTML = "";
   document.body.classList.remove("bot-responding", "chats-active");
  });

  document.querySelectorAll(".suggestion-items").forEach(item => {
    item.addEventListener("click", () => {
      promptInput.value = item.querySelector(".text").textContent;
      promptForm.dispatchEvent(new Event("submit"));
    });
  });

  document.addEventListener("click", ({target}) => {
    const wrapper = document.querySelector(".prompt-wrapper");
    const shouldHide = target.classList.contains("prompt-input") || (wrapper.classList.contains("hide-controls") &&
  (target.id === "add-file-btn" || target.id === "stop-response-btn"));
  wrapper.classList.toggle("hide-controls", shouldHide);
    })

  // Handle Enter key in prompt input
   promptInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        promptForm.dispatchEvent(new Event("submit"));
      }
    });

  // Fix theme toggle functionality
  themeToggle.addEventListener("click", () => {
    const isLightTheme = document.body.classList.toggle("light-theme");
    const icon = themeToggle.querySelector("i");
    
    // Toggle between sun and moon icons
    if (isLightTheme) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    } else {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }
  });

 promptForm.addEventListener("submit", handleFormSubmit);
 document.getElementById("send-prompt-btn").addEventListener("click", () => {
   promptForm.dispatchEvent(new Event("submit"));
 });
