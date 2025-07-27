# Blueberry Loom
Cryptographically reinforced form builder that utilizes ML-KEM-1024, as well as the "ChaCha20 + Serpent-256 CBC + HMAC-SHA3-512" authenticated encryption scheme to enable end-to-end encryption for enhanced data protection.

Check it out at https://blueberry-loom.netlify.app/

**You can set a password that contains non-ASCII characters.**

The article about how this web app was built and how it works—including the part that covers the cryptographic mechanisms ensuring only the intended recipient is capable of decrypting a submitted response, and explaining how it came to be that way—is available at https://medium.com/@Northstrix/creating-a-form-builder-powered-by-advanced-cryptography-d1e827a6ddd5

SourceForge page with the version of the app where forms can be accessed using dedicated links instead of tags https://sourceforge.net/projects/blueberry-loom/

The app is localized into the following languages:

- **English**
- **Hebrew** (some inscriptions Latinized)
- **Latin American Spanish**
- **German**
- **French**
- **Italian**
- **Brazilian Portuguese**
- **Polish**
- **Cantonese**

![Alt Hero section](https://raw.githubusercontent.com/Northstrix/blueberry-loom/refs/heads/main/screenshots/hero-section.png)
![Alt Hero section with language selector](https://raw.githubusercontent.com/Northstrix/blueberry-loom/refs/heads/main/screenshots/hero-section-with-language-selector.png)
![Alt Features section](https://raw.githubusercontent.com/Northstrix/blueberry-loom/refs/heads/main/screenshots/features-section.png)
![Alt Part of the landing page with MacBook](https://raw.githubusercontent.com/Northstrix/blueberry-loom/refs/heads/main/screenshots/part-of-the-landing-page-with-macbook.png)
![Alt Form Builder](https://raw.githubusercontent.com/Northstrix/blueberry-loom/refs/heads/main/screenshots/drag-and-drop-form-builder.png)
![Alt Dashboard](https://raw.githubusercontent.com/Northstrix/blueberry-loom/refs/heads/main/screenshots/dashboard.png)
![Alt Footer](https://raw.githubusercontent.com/Northstrix/blueberry-loom/refs/heads/main/screenshots/footer.png)

## How to run

I assume you already have Node.js and npm installed.


1. Clone the repository using the command:

    ```
    git clone https://github.com/Northstrix/blueberry-loom
    ```

2. Open the project:

    - Open the cloned folder in VS Code or any IDE of your choice.

3. Configure Firebase:

    - Open `app/lib/firebase.ts` file.
    - Create a Firebase instance with Authentication and Firestore Database enabled.
    - Create a new web app in the Firebase instance.
    - Replace the mock credentials in `firebase.ts` with your actual Firebase credentials and save the file.

4. Set Firestore rules:

    - Apply the following rules to your Firestore database:

      ```
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
        
            // === 1. /data/{userEmail}/forms/{formId} ===
            match /data/{userEmail}/forms/{formId} {
              // Allow anyone to increment visits or responses by +1, but only if form is public
              allow update: if (
                resource.data.isPublic == true &&
                (
                  (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['visits']) && request.resource.data.visits == resource.data.visits + 1) ||
                  (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['responses']) && request.resource.data.responses == resource.data.responses + 1)
                )
              );
        
              // Allow get/list if public, or if the user is the owner and email is verified
              allow get, list: if resource.data.isPublic == true
                || (request.auth != null && request.auth.token.email == userEmail && request.auth.token.email_verified == true);
        
              // Allow create, update, delete only if the user is the owner and email is verified
              allow create, update, delete: if request.auth != null && request.auth.token.email == userEmail && request.auth.token.email_verified == true;
            }
        
            // === 1b. /data/{userEmail}/forms/{formId}/{document=**} ===
            match /data/{userEmail}/forms/{formId}/{document=**} {
              // Owner (with verified email) can read/write/delete
              allow read, write, delete: if request.auth != null && request.auth.token.email == userEmail && request.auth.token.email_verified == true;
        
              // Anyone can get/list if parent form is public
              allow get, list: if exists(/databases/$(database)/documents/data/$(userEmail)/forms/$(formId))
                && get(/databases/$(database)/documents/data/$(userEmail)/forms/$(formId)).data.isPublic == true;
            }
        
            // === 2. /data/{userEmail}/receivedResponses/{document=**} ===
            match /data/{userEmail}/receivedResponses/{document=**} {
              allow write: if true; // Anyone (including non-authenticated users) can write
              allow read, delete: if request.auth != null && request.auth.token.email == userEmail; // Only owner can read/delete
            }
        
            // === 2b. /data/{userEmail}/receivedBackups/{document=**} ===
            match /data/{userEmail}/receivedBackups/{document=**} {
              allow write: if true; // Anyone (including non-authenticated users) can write
              allow read, delete: if request.auth != null && request.auth.token.email == userEmail; // Only owner can read/delete
            }
        
            // === 3. /data/{userEmail}/public/{document=**} ===
            match /data/{userEmail}/public/{document=**} {
              allow read: if true; // Anyone can read
              allow write, delete: if request.auth != null && request.auth.token.email == userEmail; // Only owner can write/delete
            }
        
            // === 4. /data/{userEmail}/private/encrypted/formData/all/keys/{uniqueFormId} ===
            match /data/{userEmail}/private/encrypted/formData/all/keys/{uniqueFormId} {
              // Only owner with verified email can write/read
              allow create, read, update, delete: if request.auth != null && request.auth.token.email == userEmail && request.auth.token.email_verified == true;
            }
        
            // === 5. /data/{userEmail}/private/{document=**} ===
            match /data/{userEmail}/private/{document=**} {
              // Any authenticated user can read/write/delete their own private route (regardless of email verification)
              allow read, write, delete: if request.auth != null && request.auth.token.email == userEmail;
            }
        
            // === 6. /data/{userEmail}/private root ===
            match /data/{userEmail}/private {
              allow read, write, delete: if request.auth != null && request.auth.token.email == userEmail;
            }
        
            // === 7. Default deny ===
            match /{document=**} {
              allow read, write, delete: if false;
            }
          }
        }
      ```

5. Install dependencies by running:

    ```
    npm install
    ```

6. Start the development server with:

    ```
    npm run dev
    ```

7. Set up the [form loader](https://github.com/Northstrix/blueberry-loom-form-loader) *optional

    7.1. Repalce the form loader base URL within the app with your own (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> -> https://blueberry-loom-form-loader.netlify.app)

## Credit

[Text Rotate](https://www.fancycomponents.dev/docs/components/text/text-rotate) by [fancy components](https://www.fancycomponents.dev/)

[motion](https://github.com/motiondivision/motion) by [motiondivision](https://github.com/motiondivision)

[GSAP](https://github.com/greensock/GSAP) by [greensock](https://github.com/greensock)

[Sign In](https://hextaui.com/docs/marketing/sign-in) by [HextaUI](https://hextaui.com/)

[Chronicle Button](https://codepen.io/Haaguitos/pen/OJrVZdJ) by [Haaguitos](https://codepen.io/Haaguitos)

[Input Floating Label animation](https://codepen.io/Mahe76/pen/qBQgXyK) by [Elpeeda](https://codepen.io/Mahe76)

[react-toastify](https://github.com/fkhadra/react-toastify) by [Fadi Khadra](https://github.com/fkhadra)

[sweetalert2](https://github.com/sweetalert2/sweetalert2) by [sweetalert2](https://github.com/sweetalert2)

[react-i18next](https://github.com/i18next/react-i18next) by [i18next](https://github.com/i18next)

[hash-wasm](https://github.com/Daninet/hash-wasm) by [Daninet](https://github.com/Daninet)

[firebase-js-sdk](https://github.com/firebase/firebase-js-sdk) by [firebase](https://github.com/firebase/firebase-js-sdk)

[mipher](https://github.com/mpaland/mipher) by [mpaland](https://github.com/mpaland)

[BUTTONS](https://codepen.io/uchihaclan/pen/NWOyRWy) by [TAYLOR](https://codepen.io/uchihaclan)

[Bento Grid](https://ui.aceternity.com/components/bento-grid) by [Aceternity UI](https://ui.aceternity.com/)

[lucide](https://github.com/lucide-icons/lucide) by [lucide-icons](https://github.com/lucide-icons)

[Shining Text](https://hextaui.com/docs/text/text-shining) by [HextaUI](https://hextaui.com/)

[Radix Checkbox](https://21st.dev/animate-ui/radix-checkbox/radix-checkbox-demo) by [Animate UI](https://21st.dev/animate-ui)

[Custom Checkbox](https://21st.dev/Edil-ozi/custom-checkbox/default) by [Edil Ozi](https://21st.dev/Edil-ozi)

[チェックしないと押せないボタン](https://codepen.io/ash_creator/pen/JjZReNm) by [あしざわ - Webクリエイター](https://codepen.io/ash_creator)

[Help Button](https://21st.dev/ln-dev7/help-button/default) by [LN](https://21st.dev/ln-dev7)

[DraggableList](https://hextaui.com/docs/application/draggable-list) by [HextaUI](https://hextaui.com/)

[Haiku](https://www.reacthaiku.dev/) by [DavidHDev](https://github.com/DavidHDev)

[Dot Loader](https://21st.dev/paceui/dot-loader/default) by [PaceUI](https://www.paceui.com/)

[UZUMAKI](https://codepen.io/Alansdead/pen/zxGyOmx) by [Jules](https://codepen.io/Alansdead)

[Parallax Floating](https://www.fancycomponents.dev/docs/components/image/parallax-floating) by [fancy components](https://www.fancycomponents.dev/)

[Glowing Effect](https://ui.aceternity.com/components/glowing-effect) by [Aceternity UI](https://ui.aceternity.com/)

[Card Spotlight](https://ui.aceternity.com/components/card-spotlight) by [Aceternity UI](https://ui.aceternity.com/)

[Canvas Reveal Effect](https://ui.aceternity.com/components/canvas-reveal-effect) by [Aceternity UI](https://ui.aceternity.com/)

[Fey.com Macbook Scroll](https://ui.aceternity.com/components/macbook-scroll) by [Aceternity UI](https://ui.aceternity.com/)

[Tranquiluxe](https://uvcanvas.com/docs/components/tranquiluxe) by [UV Canvas](https://uvcanvas.com/)

[Animated Tooltip](https://ui.aceternity.com/components/animated-tooltip) by [Aceternity UI](https://ui.aceternity.com/)

[Wheel Picker](https://21st.dev/ncdai/wheel-picker/default) by [Chánh Đại](https://21st.dev/ncdai)

[React Wheel Picker](https://www.npmjs.com/package/@ncdai/react-wheel-picker) by [Chánh Đại](https://github.com/ncdai)

[Resizable Navbar](https://ui.aceternity.com/components/resizable-navbar) by [Aceternity UI](https://ui.aceternity.com/)

[Menu Vertical](https://21st.dev/berlix/menu-vertical/default) by [Berlix UI](https://berlix.vercel.app/)

[Perplexity](https://www.perplexity.ai/)
