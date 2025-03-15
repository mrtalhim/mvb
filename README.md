# MVB Application (Version 1.6)

[Optional: Add a project logo or screenshot here]

# Project Description

The MVB Application is a Progressive Web App (PWA) designed to replace traditional paper money in tabletop property trading games. This single-device application provides a user-friendly digital banking solution for in-person games, allowing players around a table to manage virtual wallets on a shared device. Version 1.6 offers a polished UI/UX with a fixed grid layout, modal input, currency abbreviation, default board content rotation, and drag-and-drop transactions, creating a seamless and engaging digital banking experience for tabletop gameplay.

# Key Features (Version 1.6)

Virtual Bank and Tax Wallets: Digital wallets for managing Bank and Tax funds, separate from player wallets.

Multi-Player Wallet Management: Supports up to 8 players, each with individual digital wallets on a single device.

Balance Management: Players can easily view and manage their balances, and the application internally tracks transactions for accurate balance updates.

Drag and Drop Transactions: Intuitive drag and drop interface for initiating transactions between player wallets, Bank, and Tax.

Modal Number Input: Clean modal (popup) interface for entering transaction amounts, with calculator-style input and input masking.

Currency Abbreviation: Wallet balances are displayed with currency abbreviations (K for thousands, M for millions) for improved readability of large amounts.

Default Board Content Rotation: Wallet board content (player name, balance) automatically rotates to face the intended player around the tabletop.

Tabletop-Optimized Layouts: Fixed grid layouts for 2, 3, 4, 5, 6, 7, and 8 players, optimized for tabletop visibility on a shared device.

Installable PWA: The application can be installed as a Progressive Web App (PWA) for a near-native app experience on tablets and smartphones.

Serverless and Cost-Free: Built with client-side technologies for serverless operation and cost-free deployment on platforms like GitHub Pages.

# Technologies Used

Frontend Framework: Vue.js 3

Styling Framework: Tailwind CSS 4

Drag and Drop Library: Vue Draggable (for future enhancements, basic drag and drop implemented with HTML5 Drag and Drop API in Version 1.6)

JavaScript Bundler/Build Tool: Vite

PWA Support: Workbox (or Vue PWA Plugin for future enhancements)

# Deployment

Version 1.6 is designed for easy deployment on GitHub Pages or other static hosting platforms. Simply build the application using Vite (or Vue CLI) and deploy the contents of the dist folder to your hosting platform.

Limitations (Version 1.6)
Single-device tabletop operation only (no peer-to-peer multi-device support).

Basic internal transaction tracking (no user-viewable transaction logs in Version 1.6).

Edit Layout Mode features deferred to future versions.

Basic PWA installability (more advanced PWA features deferred to future versions).

Future Development (Roadmap)
Future versions are planned to include:

Peer-to-Peer Multi-Device Functionality for networked gameplay.

Enhanced Edit Layout Mode with board rearrangement and rotation controls.

User-Viewable Transaction Logs for detailed game session history.

Advanced Game Features (rent calculation, property management, etc.).

Further UI/UX Polish and User Customization Options.

# Live Demo

[Optional: Add a link to a live demo of the application if deployed on GitHub Pages or a similar platform]
