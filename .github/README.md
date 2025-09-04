# Flexx: A Personalized AI Homework Assistant

Flexx is a custom-built, conversational AI assistant designed to provide personalized, interactive, and multilingual homework help for students. Powered by Google's Gemini model, it goes beyond simple answers to foster real understanding, acting as a patient and encouraging digital tutor.

## The Story Behind Flexx

This project was born out of a simple need: to help my younger brother with his daily homework. Like many students, he often found it difficult to get clear, step-by-step explanations for his questions, especially for subjects taught in **Urdu**.

I realized he needed a tool that was more than just an information retriever—he needed a companion that could:
- Understand his specific questions, whether typed or in a picture.
- Explain complex concepts in the language he was most comfortable with.
- Adapt its teaching style to the subject he was studying.

This application is the result: a personalized learning assistant built to be the supportive, always-available homework helper I wished my brother had.

## Core Features

Flexx is packed with features specifically designed to create a seamless and effective learning experience for students.

*   **🌐 Bilingual Explanations:** Students can switch between **English** and **Urdu** in the settings, and the AI will provide all explanations in the selected language, breaking down language barriers in learning.

*   **📝 Multi-Subject Support:** The assistant's responses are tailored to the specific subject selected by the student, including Maths, Science, History, Geography, English, and Urdu. This ensures the AI provides relevant context and uses the correct terminology.

*   **📸 Visual Problem Solving (Image & Camera):**
    *   **File Upload:** Students can upload images directly from their device, perfect for sharing screenshots or pictures of textbook pages.
    *   **Live Camera Capture:** Using the device's camera, students can instantly snap a photo of a tricky math problem, a diagram, or a paragraph they are struggling with.
    *   **Integrated Cropping Tool:** After capturing a photo, a built-in cropper allows the student to select only the relevant part of the image, ensuring the AI focuses on the exact question.

*   **🎚️ Adjustable Response Length:** Students can choose their desired level of detail.

*   **🔎 Integrated Web Search:** For questions requiring the most current information, a simple toggle button enables a powerful web search tool. This allows the AI to ground its answers in up-to-date facts and data.

*   **💬 Real-Time Streaming & UX:**
    *   Responses are streamed in real-time, creating a natural, conversational feel.
    *   A "thinking" animation appears immediately after a question is sent, providing visual feedback that the assistant is working on the answer.

*   **📱 Fully Responsive Design:** The entire interface is designed to work flawlessly on both desktop browsers and mobile devices, making it accessible wherever a student is studying.

## How It Works: Technology & Architecture

This application leverages a modern technology stack to deliver a fast, reliable, and intelligent experience.

#### Backend
*   **Framework:** **FastAPI** provides the high-performance asynchronous API that powers the application.
*   **AI Integration:** **LiteLLM** serves as a brilliant abstraction layer to communicate seamlessly with **Google's Gemini** family of models.

#### Frontend
*   **Core:** The frontend is built with clean, modern **HTML5**, **CSS3**, and **Vanilla JavaScript**, ensuring it is lightweight and fast.
*   **Image Cropping:** **Cropper.js** is integrated to provide the intuitive and powerful image cropping functionality.
*   **Markdown Rendering:** **Marked.js** is used to beautifully format the AI's responses, rendering lists, bold text, and other formatting for better readability.
*   **Streaming & State Management:** The frontend uses the native **Fetch API** to handle the streaming of Server-Sent Events (SSE) from the backend, and carefully manages the chat history to provide a stateful conversational experience.