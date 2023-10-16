const messages = [
    {
      id: 1,
      type: "text",
      text: "Hello, how are you?",
      sender: {
        id: "user123",
        name: "John Doe",
        photoURL: "https://example.com/user123.jpg",
      },
    },
    {
      id: 2,
      type: "image",
      image: "https://example.com/image.jpg",
      sender: {
        id: "user456",
        name: "Alice Johnson",
        photoURL: "https://example.com/user456.jpg",
      },
    },
    {
      id: 3,
      type: "video",
      video: "https://example.com/video.mp4",
      sender: {
        id: "user789",
        name: "Bob Smith",
        photoURL: "https://example.com/user789.jpg",
      },
    },
    // ... autres messages
  ];
  
  export default messages;
  