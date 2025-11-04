export const navigationLinks = [
    {
      href: "/library",
      label: "Library",
    },
  
    {
      img: "/icons/user.svg",
      selectedImg: "/icons/user-fill.svg",
      href: "/my-profile",
      label: "My Profile",
    },
  ];
  
  export const adminSideBarLinks = [
    {
      img: "/icons/admin/home.svg",
      route: "/admin",
      text: "Home",
    },
    {
      img: "/icons/admin/users.svg",
      route: "/admin/users",
      text: "All Users",
    },
    {
      img: "/icons/admin/book.svg",
      route: "/admin/books",
      text: "All Books",
    },
    {
      img: "/icons/admin/arrow.svg",
      route: "/admin/approvals",
      text: "Upload Requests",
    },
    {
      img: "/icons/admin/user.svg",
      route: "/admin/account-requests",
      text: "Account Requests",
    },
  ];
  
  export const FIELD_NAMES = {
    fullName: "Full name",
    email: "Email",
    password: "Password",
  };
  
  export const FIELD_TYPES = {
    fullName: "text",
    email: "email",
    password: "password",
  };
  
  export const sampleBooks = [
    {
      id: 1,
      title: "The Midnight Library",
      author: "Matt Haig",
      genre: "Fantasy / Fiction",
      rating: 4.6,
      total_copies: 20,
      available_copies: 10,
      description:
        "A dazzling novel about all the choices that go into a life well lived, The Midnight Library tells the story of Nora Seed as she finds herself between life and death.",
      coverColor: "#1c1f40",
      coverUrl: "https://m.media-amazon.com/images/I/81J6APjwxlL.jpg",
      video: "/sample-video.mp4?updatedAt=1722593504152",
      summary:
        "A dazzling novel about all the choices that go into a life well lived, The Midnight Library tells the story of Nora Seed as she finds herself between life and death. A dazzling novel about all the choices that go into a life well lived, The Midnight Library tells the story of Nora Seed as she finds herself between life and death.",
   
      },
    {
      id: 2,
      title: "Atomic Habits",
      author: "James Clear",
      genre: "Self-Help / Productivity",
      rating: 4.9,
      total_copies: 99,
      available_copies: 50,
      description:
        "A revolutionary guide to making good habits, breaking bad ones, and getting 1% better every day.",
      coverColor: "#fffdf6",
      coverUrl: "https://m.media-amazon.com/images/I/81F90H7hnML.jpg",
      video: "/sample-video.mp4?updatedAt=1722593504152",
      summary:
        "A revolutionary guide to making good habits, breaking bad ones, and getting 1% better every day.",
       
    },
    {
      id: 3,
      title: "You Don't Know JS: Scope & Closures",
      author: "Kyle Simpson",
      genre: "Computer Science / JavaScript",
      rating: 4.7,
      total_copies: 9,
      available_copies: 5,
      description:
        "An essential guide to understanding the core mechanisms of JavaScript, focusing on scope and closures.",
      coverColor: "#f8e036",
      coverUrl:
        "https://m.media-amazon.com/images/I/7186YfjgHHL._AC_UF1000,1000_QL80_.jpg",
      video: "/sample-video.mp4?updatedAt=1722593504152",
      summary:
        "An essential guide to understanding the core mechanisms of JavaScript, focusing on scope and closures.",
       
    },
    {
      id: 4,
      title: "The Alchemist",
      author: "Paulo Coelho",
      genre: "Philosophy / Adventure",
      rating: 4.5,
      total_copies: 78,
      available_copies: 50,
      description:
        "A magical tale of Santiago, an Andalusian shepherd boy, who embarks on a journey to find a worldly treasure.",
      coverColor: "#ed6322",
      coverUrl:
        "https://m.media-amazon.com/images/I/61HAE8zahLL._AC_UF1000,1000_QL80_.jpg",
      video: "/sample-video.mp4?updatedAt=1722593504152",
      summary:
        "A magical tale of Santiago, an Andalusian shepherd boy, who embarks on a journey to find a worldly treasure.",
    },
    {
      id: 5,
      title: "Deep Work",
      author: "Cal Newport",
      genre: "Self-Help / Productivity",
      rating: 4.7,
      total_copies: 23,
      available_copies: 23,
      description:
        "Rules for focused success in a distracted world, teaching how to cultivate deep focus to achieve peak productivity.",
      coverColor: "#ffffff",
      coverUrl: "https://m.media-amazon.com/images/I/81JJ7fyyKyS.jpg",
      video: "/sample-video.mp4?updatedAt=1722593504152",
      summary:
        "Rules for focused success in a distracted world, teaching how to cultivate deep focus to achieve peak productivity.",
    },
    {
      id: 6,
      title: "Clean Code",
      author: "Robert C. Martin",
      genre: "Computer Science / Programming",
      rating: 4.8,
      total_copies: 56,
      available_copies: 56,
      description:
        "A handbook of agile software craftsmanship, offering best practices and principles for writing clean and maintainable code.",
      coverColor: "#080c0d",
      coverUrl:
        "https://m.media-amazon.com/images/I/71T7aD3EOTL._UF1000,1000_QL80_.jpg",
      video: "/sample-video.mp4?updatedAt=1722593504152",
      summary:
        "A handbook of agile software craftsmanship, offering best practices and principles for writing clean and maintainable code.",
    },
    {
      id: 7,
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt, David Thomas",
      genre: "Computer Science / Programming",
      rating: 4.8,
      total_copies: 25,
      available_copies: 3,
      description:
        "A timeless guide for developers to hone their skills and improve their programming practices.",
      coverColor: "#100f15",
      coverUrl:
        "https://m.media-amazon.com/images/I/71VStSjZmpL._AC_UF1000,1000_QL80_.jpg",
      video: "/sample-video.mp4?updatedAt=1722593504152",
      summary:
        "A timeless guide for developers to hone their skills and improve their programming practices.",
    },
    {
      id: 8,
      title: "The Psychology of Money",
      author: "Morgan Housel",
      genre: "Finance / Self-Help",
      rating: 4.8,
      total_copies: 10,
      available_copies: 5,
      description:
        "Morgan Housel explores the unique behaviors and mindsets that shape financial success and decision-making.",
      coverColor: "#ffffff",
      coverUrl:
        "https://m.media-amazon.com/images/I/81Dky+tD+pL._AC_UF1000,1000_QL80_.jpg",
      video: "/sample-video.mp4?updatedAt=1722593504152",
      summary:
        "Morgan Housel explores the unique behaviors and mindsets that shape financial success and decision-making.",
    },
    {
      id: 9,
      title: "Rich Dad poor Dad",
      author: "Robert T. Kiyosaki",
      genre: "Finance / Motivation",
      rating: 4.2,
      total_copies: 50,
      available_copies: 34,
      description:"Rich Dad poor Dad is a strating point for anyone looking to gain control of thier financial future.",
      coverColor: "#7c6b62",
      coverUrl: "https://m.media-amazon.com/images/I/81J6APjwxlL.jpg",
      video: "/sample-video.mp4?updatedAt=1722593504152",
      summary:
       "Rich Dad poor Dad is a strating point for anyone looking to gain control of thier financial future.",
      },
      {
        id: 10,
        title: "Thinking Fast and Slow",
        author: "Daniel Kahneman",
        genre: "Mindset / Motivational",
        rating: 3.6,
        total_copies: 10,
        available_copies: 5,
        description:"too important to be ignored",
        coverColor: "#f5deb3",
        coverUrl: "https://m.media-amazon.com/images/I/81J6APjwxlL.jpg",
        video: "/sample-video.mp4?updatedAt=1722593504152",
        summary:
                "too important to be ignored",     
        },
        {
          id: 11,
          title: "The Ultimate Next.js Eboook",
          author: "{JS} mastery",
          genre: "Computer Science / Programming",
          rating: 5.0,
          total_copies: 100,
          available_copies: 30,
          description:
          "Dive into Next.js, a flexible react framework",          
          coverColor: "#oa1128",
          coverUrl: "https://m.media-amazon.com/images/I/81J6APjwxlL.jpg",
          video: "/sample-video.mp4?updatedAt=1722593504152",
          summary:
            "Dive into next.js, a flexible react framework",       
          },
          {
            id: 12,
            title: "The One Thing",
            author: "Gary Keller",
            genre: "Inspirational / Motivational",
            rating: 4.9,
            total_copies: 30,
            available_copies: 14,
            description:
            "The Suprisingly simple truth behind extraordinary results.",         
            coverColor: "#ffffff",
            coverUrl: "https://m.media-amazon.com/images/I/81J6APjwxlL.jpg",
            video: "/sample-video.mp4?updatedAt=1722593504152",
            summary:
"The suprisingly simple truth behind etraordinary results.",         
            },
            {
              id: 13,
              title: "Slow Productivity",
              author: "Cal Newport",
              genre: "Inspirational / Motivational",
              rating: 4.9,
              total_copies: 30,
              available_copies: 14,
              description:
              "The rise and falll of pseudo-productivity.",         
              coverColor: "brown",
              coverUrl: "https://m.media-amazon.com/images/I/81J6APjwxlL.jpg",
              video: "/sample-video.mp4?updatedAt=1722593504152",
              summary:
  "The rise and fall of pseudo-productivity.",         
              },
              {
                id: 14,
                title: "Feel good production",
                author: "Ali Abdaal",
                genre: "Inspirational / Motivational",
                rating: 4.0,
                total_copies: 30,
                available_copies: 14,
                description:
                "How to do what matters to you.",         
                coverColor: "blue",
                coverUrl: "https://m.media-amazon.com/images/I/81J6APjwxlL.jpg",
                video: "/sample-video.mp4?updatedAt=1722593504152",
                summary:
    "How to what matters to you.",         
                },
              
  ];
  