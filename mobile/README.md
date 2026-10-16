# Kajy Vola Mobile

Application Ionic/Angular offline-first pour Kajy Vola. Le fichier `kajy_vola_fitantanana_vola_malagasy.html` est conservé comme référence de parcours et de mise en page ; il n'est pas utilisé par l'application.

## Démarrage

```bash
npm install
npm start
```

La compilation de production se lance avec `npm run build` et produit les fichiers dans `www/browser/`.

## Données hors ligne

L'application est structurée pour utiliser SQLite comme source de vérité locale. Le schéma contient les catégories, transactions, réglages, profil local et une file de synchronisation. Chaque entité possède un identifiant local, un identifiant serveur optionnel et un état de synchronisation.

## Compte et synchronisation

Un compte peut être créé ou connecté depuis l’écran **Compte et synchronisation**. Le jeton est stocké avec Capacitor Preferences et la synchronisation reste une action explicite.

La synchronisation utilise désormais `POST /sync/synchronize`. Chaque objet mobile transporte un identifiant client et une date de modification : les tentatives répétées sont idempotentes et une version serveur plus récente est signalée comme conflit. La réponse retourne aussi un snapshot serveur, prêt à alimenter la fusion locale lors de l’ajout des écrans de modification et suppression.

En développement, l’API pointe vers `http://localhost:8000` dans le navigateur et `http://10.0.2.2:8000` dans l’émulateur Android. Cette valeur doit être remplacée par l’URL HTTPS de production avant publication.

## Sécurité et Android

Les jetons sont stockés dans Android Keystore et iOS Keychain avec `@aparajita/capacitor-secure-storage`. Le repli navigateur est strictement destiné au développement.

Après une modification web, reconstruire et synchroniser la cible native :

```bash
npm run build
npx cap sync android
```

Le projet Android est dans `mobile/android/`. Pour générer un APK debug :

```bash
cd android
GRADLE_USER_HOME=../.gradle ./gradlew assembleDebug
```

Avant publication, remplacer l’URL de développement de l’API par l’URL HTTPS de production dans `src/app/core/services/account.service.ts`, appliquer `alembic upgrade head` dans le backend, puis tester la synchronisation sur un appareil réel.
