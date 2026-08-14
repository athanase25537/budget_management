import { Injectable, signal } from '@angular/core';

export type AppLanguage = 'fr' | 'en' | 'mg';

type Translation = Record<AppLanguage, string>;

const translations: Translation[] = [
  { fr: 'Tableau de bord', en: 'Dashboard', mg: 'Tabilao' },
  { fr: 'Statistiques', en: 'Statistics', mg: 'Antontanisa' },
  { fr: 'Transactions', en: 'Transactions', mg: 'Fifanakalozana' },
  { fr: 'Catégories', en: 'Categories', mg: 'Sokajy' },
  { fr: 'Profil', en: 'Profile', mg: 'Mombamomba' },
  { fr: 'Paramètres', en: 'Settings', mg: 'Fikirana' },
  { fr: 'Déconnexion', en: 'Logout', mg: 'Hivoaka' },
  { fr: 'Rechercher...', en: 'Search...', mg: 'Karohy...' },
  { fr: 'Bienvenue', en: 'Welcome Back', mg: 'Tongasoa indray' },
  { fr: 'Connectez-vous pour accéder à votre compte.', en: 'Sign in to continue to your account.', mg: 'Midira hanohizana amin’ny kaontinao.' },
  { fr: 'Créer un compte', en: 'Create Account', mg: 'Hamorona kaonty' },
  { fr: 'Rejoignez-nous dès aujourd’hui.', en: 'Join us today and start your journey.', mg: 'Miaraha aminay anio ary atombohy ny dianao.' },
  { fr: 'Ou continuer avec', en: 'Or continue with', mg: 'Na tohizo amin’ny' },
  { fr: 'Ou s’inscrire avec', en: 'Or register with', mg: 'Na misoratra anarana amin’ny' },
  { fr: 'Nom d’utilisateur', en: 'Username', mg: 'Anaran-kaonty' },
  { fr: 'Mot de passe', en: 'Password', mg: 'Teny miafina' },
  { fr: 'Nom', en: 'Name', mg: 'Anarana' },
  { fr: 'Prénom', en: 'First name', mg: 'Fanampin’anarana' },
  { fr: 'Le nom d’utilisateur est requis.', en: 'Username is required.', mg: 'Tsy maintsy fenoina ny anaran-kaonty.' },
  { fr: 'Minimum 3 caractères.', en: 'Minimum 3 characters.', mg: 'Tarehintsoratra 3 farafahakeliny.' },
  { fr: 'Le mot de passe est requis.', en: 'Password is required.', mg: 'Tsy maintsy fenoina ny teny miafina.' },
  { fr: 'Minimum 6 caractères.', en: 'Minimum 6 characters.', mg: 'Tarehintsoratra 6 farafahakeliny.' },
  { fr: 'Le nom est requis.', en: 'Name is required.', mg: 'Tsy maintsy fenoina ny anarana.' },
  { fr: 'Minimum 2 caractères.', en: 'Minimum 2 characters.', mg: 'Tarehintsoratra 2 farafahakeliny.' },
  { fr: 'Le prénom est requis.', en: 'First name is required.', mg: 'Tsy maintsy fenoina ny fanampin’anarana.' },
  { fr: 'Se connecter', en: 'Sign in', mg: 'Hiditra' },
  { fr: 'S’inscrire', en: 'Sign up', mg: 'Hisoratra anarana' },
  { fr: 'Pas encore de compte ?', en: "Don't have an account?", mg: 'Tsy mbola manana kaonty?' },
  { fr: 'Vous avez déjà un compte ?', en: 'Already have an account?', mg: 'Efa manana kaonty?' },
  { fr: 'Budget', en: "Budget's stats", mg: 'Antontanisan’ny tetibola' },
  { fr: 'Ajouter une transaction', en: 'Add a new transaction', mg: 'Hanampy fifanakalozana' },
  { fr: 'Action rapide', en: 'Quick action', mg: 'Hetsika haingana' },
  { fr: 'Avez-vous gagné ou dépensé de l’argent aujourd’hui ? Enregistrez-le immédiatement pour garder le contrôle.', en: 'Did you earn or spend money today ? Record it instantly to stay on track.', mg: 'Nahazo sa nandany vola androany ve ianao? Raketo avy hatrany izany.' },
  { fr: 'Historique des transactions', en: 'Transaction History', mg: 'Tantaran’ny fifanakalozana' },
  { fr: 'Voir toutes les transactions', en: 'See all transactions', mg: 'Jereo ny fifanakalozana rehetra' },
  { fr: 'Toutes les transactions', en: 'All transactions', mg: 'Ny fifanakalozana rehetra' },
  { fr: 'Analyse', en: 'Analysis', mg: 'Fanadihadiana' },
  { fr: 'Sélectionnez des transactions', en: 'Select transactions', mg: 'Misafidiana fifanakalozana' },
  { fr: 'Entrée', en: 'Income', mg: 'Vola miditra' },
  { fr: 'Sortie', en: 'Outcome', mg: 'Vola mivoaka' },
  { fr: 'Ajouter une entrée', en: 'Add Income', mg: 'Hanampy vola miditra' },
  { fr: 'Ajouter une sortie', en: 'Add Outcome', mg: 'Hanampy vola mivoaka' },
  { fr: 'Nouvelle entrée', en: 'New Income', mg: 'Vola miditra vaovao' },
  { fr: 'Nouvelle sortie', en: 'New Outcome', mg: 'Vola mivoaka vaovao' },
  { fr: 'Modifier la transaction', en: 'Update transaction', mg: 'Hanova fifanakalozana' },
  { fr: 'Montant', en: 'Amount', mg: 'Vola' },
  { fr: 'Date', en: 'Date', mg: 'Daty' },
  { fr: 'Type de transaction', en: 'Transaction Type', mg: 'Karazan’ny fifanakalozana' },
  { fr: 'Catégorie', en: 'Category', mg: 'Sokajy' },
  { fr: 'Raison', en: 'Reason', mg: 'Antony' },
  { fr: 'Statut', en: 'Status', mg: 'Sata' },
  { fr: 'Action', en: 'Action', mg: 'Hetsika' },
  { fr: 'Tout', en: 'All', mg: 'Rehetra' },
  { fr: 'Cette semaine', en: 'This week', mg: 'Amin’ity herinandro ity' },
  { fr: 'Ce mois', en: 'This month', mg: 'Amin’ity volana ity' },
  { fr: 'Cette année', en: 'This year', mg: 'Amin’ity taona ity' },
  { fr: 'Plage', en: 'Range', mg: 'Elanelam-potoana' },
  { fr: 'Réinitialiser les dates', en: 'Reset dates', mg: 'Avereno ny daty' },
  { fr: 'Date de début', en: 'Start date', mg: 'Daty fanombohana' },
  { fr: 'Date de fin', en: 'End date', mg: 'Daty famaranana' },
  { fr: 'La date de début doit être antérieure ou égale à la date de fin.', en: 'The start date must be before or equal to the end date.', mg: 'Ny daty fanombohana dia tsy maintsy alohan na mitovy amin’ny daty famaranana.' },
  { fr: 'Chargement des transactions...', en: 'Loading transactions...', mg: 'Eo am-pakana ny fifanakalozana...' },
  { fr: 'Aucune transaction enregistrée', en: 'You have no transaction recorded', mg: 'Tsy mbola misy fifanakalozana voarakitra' },
  { fr: 'Aucune transaction trouvée', en: 'No transactions found', mg: 'Tsy nahitana fifanakalozana' },
  { fr: 'Affichage de', en: 'Displaying', mg: 'Aseho' },
  { fr: 'sur', en: 'of', mg: 'amin’ny' },
  { fr: 'transactions', en: 'transactions', mg: 'fifanakalozana' },
  { fr: 'Par page', en: 'Per page', mg: 'Isaky ny pejy' },
  { fr: 'Première page', en: 'First page', mg: 'Pejy voalohany' },
  { fr: 'Page précédente', en: 'Previous page', mg: 'Pejy teo aloha' },
  { fr: 'Page suivante', en: 'Next page', mg: 'Pejy manaraka' },
  { fr: 'Dernière page', en: 'Last page', mg: 'Pejy farany' },
  { fr: 'Numéro de page', en: 'Page number', mg: 'Laharan-pejy' },
  { fr: 'Saisissez un numéro de page', en: 'Enter a page number', mg: 'Ampidiro ny laharan-pejy' },
  { fr: 'La page doit être comprise entre 1 et', en: 'The page must be between 1 and', mg: 'Ny pejy dia tsy maintsy eo anelanelan’ny 1 sy' },
  { fr: 'Total des catégories', en: 'Total categories', mg: 'Isan’ny sokajy' },
  { fr: 'La plus utilisée', en: 'Most used', mg: 'Ampiasaina indrindra' },
  { fr: 'Ajouter une catégorie', en: 'Add a new category', mg: 'Hanampy sokajy' },
  { fr: 'Toutes les catégories', en: 'All categories', mg: 'Ny sokajy rehetra' },
  { fr: 'Aucune catégorie', en: 'You have no category yet', mg: 'Tsy mbola misy sokajy' },
  { fr: 'Filtres', en: 'Filters', mg: 'Sivana' },
  { fr: 'Options', en: 'Options', mg: 'Safidy' },
  { fr: 'Statistiques actuelles', en: 'Current statistics', mg: 'Antontanisa ankehitriny' },
  { fr: 'Dépenses', en: 'Expenses', mg: 'Fandaniana' },
  { fr: 'Économies', en: 'Savings', mg: 'Tahiry' },
  { fr: 'Contrôles de l’échelle', en: 'Scale controls', mg: 'Fanaraha-maso mari-drefy' },
  { fr: 'Valeur minimale', en: 'Minimum value', mg: 'Sandany ambany indrindra' },
  { fr: 'Valeur maximale', en: 'Maximum value', mg: 'Sandany ambony indrindra' },
  { fr: 'Pas d’incrément', en: 'Increment step', mg: 'Dingana fiakarana' },
  { fr: 'Réinitialiser l’échelle', en: 'Reset scale', mg: 'Avereno ny mari-drefy' },
  { fr: 'Chargement...', en: 'Loading...', mg: 'Eo am-pakana...' }
  ,{ fr: 'Supprimer le compte', en: 'Delete Account', mg: 'Hamafa kaonty' }
  ,{ fr: 'Cette action est irréversible.', en: 'This action cannot be undone.', mg: 'Tsy azo averina ity hetsika ity.' }
  ,{ fr: 'Mettre à jour le profil', en: 'Update Profile', mg: 'Hanavao ny mombamomba' }
  ,{ fr: 'Épargne (%)', en: 'Economy (%)', mg: 'Tahiry (%)' }
  ,{ fr: 'Valeur statistique minimale', en: 'Minimum Value Stat', mg: 'Sandan’antontanisa ambany indrindra' }
  ,{ fr: 'Valeur statistique maximale', en: 'Maximum Value Stat', mg: 'Sandan’antontanisa ambony indrindra' }
  ,{ fr: 'Incrément', en: 'Increment', mg: 'Dingana' }
  ,{ fr: 'Enregistrement', en: 'Save', mg: 'Tehirizina' }
  ,{ fr: 'Annuler', en: 'Cancel', mg: 'Hanafoana' }
  ,{ fr: 'Confirmer', en: 'Confirm', mg: 'Hamarino' }
  ,{ fr: 'Entrées', en: 'In', mg: 'Miditra' }
  ,{ fr: 'Sorties', en: 'Out', mg: 'Mivoaka' }
  ,{ fr: 'Somme:', en: 'Sum:', mg: 'Fitambarany:' }
  ,{ fr: 'Filtres et options', en: 'Filters & Options', mg: 'Sivana sy safidy' }
  ,{ fr: 'Icône et nom', en: 'Icon & Name', mg: 'Kisary sy anarana' }
  ,{ fr: 'Représentation de la couleur', en: 'Color representation', mg: 'Fanehoana loko' }
  ,{ fr: 'Actions', en: 'Actions', mg: 'Hetsika' }
  ,{ fr: 'Nom de la catégorie', en: 'Category Name', mg: 'Anaran’ny sokajy' }
  ,{ fr: 'Type de catégorie', en: 'Category Type', mg: 'Karazan-tsokajy' }
  ,{ fr: 'Badge de couleur', en: 'Color Badge', mg: 'Mari-pamantarana loko' }
  ,{ fr: 'Sélectionnez une catégorie', en: 'Select a category', mg: 'Misafidiana sokajy' }
  ,{ fr: 'Note / raison', en: 'Reason / Note', mg: 'Antony / Fanamarihana' }
  ,{ fr: 'Nouvelle version disponible', en: 'New version available', mg: 'Misy kinova vaovao' }
  ,{ fr: 'Prenez le contrôle de', en: 'Take control of', mg: 'Raiso an-tanana ny' }
  ,{ fr: 'votre avenir financier', en: 'your financial future', mg: 'hoavinao ara-bola' }
  ,{ fr: 'Commencer gratuitement', en: 'Get started for free', mg: 'Atombohy maimaim-poana' }
  ,{ fr: 'Fonctionnalités clés', en: 'Key features', mg: 'Asa lehibe' }
  ,{ fr: 'Tout ce dont vous avez besoin pour réussir', en: 'Everything you need to succeed', mg: 'Izay rehetra ilainao hahombiazana' }
  ,{ fr: 'Suivi en Temps Réel', en: 'Real-time tracking', mg: 'Fanarahana ara-potoana' }
  ,{ fr: 'Enregistrez vos revenus et dépenses en un clic. Sachez exactement où va chaque ariary.', en: 'Record your income and expenses in one click. Know exactly where every ariary goes.', mg: 'Raketo amin’ny tsindry iray ny vola miditra sy mivoaka.' }
  ,{ fr: 'Analyses Visuelles', en: 'Visual insights', mg: 'Fanadihadiana hita maso' }
  ,{ fr: 'Des graphiques épurés et interactifs pour comprendre vos habitudes de consommation en un clin d’œil.', en: 'Clear, interactive charts to understand your spending habits at a glance.', mg: 'Tabilao mazava sy ifandraisana hahafantarana ny fahazaranao mandany.' }
  ,{ fr: 'Historique Complet', en: 'Complete history', mg: 'Tantara feno' }
  ,{ fr: 'Accédez à l’intégralité de vos transactions passées sans aucune limite pour analyser votre évolution.', en: 'Access all your past transactions without limits to analyse your progress.', mg: 'Jereo tsy misy fetra ny fifanakalozanao taloha.' }
  ,{ fr: 'Témoignages', en: 'Testimonials', mg: 'Vavolombelona' }
  ,{ fr: 'Adopté par notre communauté', en: 'Loved by our community', mg: 'Ankasitrahan’ny vondrom-piarahamonina' }
  ,{ fr: 'Prêt à transformer vos finances ?', en: 'Ready to transform your finances?', mg: 'Vonona hanova ny fitantanam-bolanao?' }
  ,{ fr: 'Créer mon compte gratuit', en: 'Create my free account', mg: 'Hamorona kaonty maimaim-poana' }
  ,{ fr: 'Êtes-vous sûr de vouloir supprimer définitivement votre compte ?', en: 'Are you sure you want to permanently delete your account?', mg: 'Tena tianao hofafana tanteraka ve ny kaontinao?' }
  ,{ fr: 'Enregistrer les modifications', en: 'Save Changes', mg: 'Tehirizo ny fanovana' }
  ,{ fr: 'Enregistrer les paramètres', en: 'Save Settings', mg: 'Tehirizo ny fikirana' }
  ,{ fr: 'Mot de passe oublié ?', en: 'Forgot password?', mg: 'Adinonao ny teny miafina?' }
  ,{ fr: 'Créer un compte', en: 'Create account', mg: 'Hamorona kaonty' }
  ,{ fr: 'Solde', en: 'Balance', mg: 'Vola sisa' }
  ,{ fr: 'Revenus du mois', en: 'Earning this month', mg: 'Vola azo amin’ity volana ity' }
  ,{ fr: 'Dépenses du mois', en: 'Spent this month', mg: 'Vola lany amin’ity volana ity' }
  ,{ fr: 'Nourriture', en: 'Food', mg: 'Sakafo' }
  ,{ fr: 'ce mois-ci', en: 'this month', mg: 'ity volana ity' }
  ,{ fr: 'Transactions de ce mois', en: 'transactions this month', mg: 'fifanakalozana amin’ity volana ity' }
  ,{ fr: 'Solde, revenus et dépenses', en: 'Balance, income and expenses overview', mg: 'Topi-maso ny vola sisa, miditra ary mivoaka' }
  ,{ fr: 'Graphiques et aperçu financier', en: 'Charts and financial insights', mg: 'Tabilao sy topi-maso ara-bola' }
  ,{ fr: 'Historique des entrées et sorties', en: 'Income and expense history', mg: 'Tantaran’ny vola miditra sy mivoaka' }
  ,{ fr: 'Gérer les catégories de transaction', en: 'Manage transaction categories', mg: 'Hitantana ny sokajin’ny fifanakalozana' }
  ,{ fr: 'Aucun résultat trouvé', en: 'No result found', mg: 'Tsy nahitana valiny' }
  ,{ fr: 'Rechercher dans l’application', en: 'Search the application', mg: 'Karohy ao amin’ny rindranasa' }
];

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly storageKey = 'app-language';
  private observer?: MutationObserver;
  readonly language = signal<AppLanguage>(this.getStoredLanguage());

  initialize(): void {
    if (typeof document === 'undefined' || this.observer) return;

    this.translateDocument();
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => this.translateNode(node));
        if (mutation.type === 'characterData') {
          this.translateTextNode(mutation.target);
        }
        if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
          this.translateAttributes(mutation.target);
        }
      }
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label', 'alt']
    });
  }

  setLanguage(language: string): void {
    if (!this.isLanguage(language)) return;

    this.language.set(language);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, language);
    }
    this.translateDocument();
  }

  private translateDocument(): void {
    if (typeof document === 'undefined') return;

    document.documentElement.lang = this.language();
    this.translateNode(document.body);
  }

  private translateNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      this.translateTextNode(node);
      return;
    }

    if (!(node instanceof HTMLElement)) return;
    if (node.hasAttribute('data-i18n-static')) return;

    this.translateAttributes(node);
    node.childNodes.forEach((child) => this.translateNode(child));
  }

  private translateTextNode(node: Node): void {
    const original = node.nodeValue;
    if (!original) return;

    const leadingWhitespace = original.match(/^\s*/)?.[0] ?? '';
    const trailingWhitespace = original.match(/\s*$/)?.[0] ?? '';
    const text = original.trim();
    const translated = this.translate(text);

    if (translated && translated !== text) {
      node.nodeValue = `${leadingWhitespace}${translated}${trailingWhitespace}`;
    }
  }

  private translateAttributes(element: HTMLElement): void {
    ['placeholder', 'title', 'aria-label', 'alt'].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      const translated = value ? this.translate(value) : undefined;
      if (translated && translated !== value) {
        element.setAttribute(attribute, translated);
      }
    });
  }

  private translate(value: string): string | undefined {
    const savingsMatch = value.match(/^Savings \((.+)% earning\)$/)
      ?? value.match(/^Épargne \((.+)% des revenus\)$/)
      ?? value.match(/^Tahiry \((.+)% amin’ny vola azo\)$/);

    if (savingsMatch) {
      const percentage = savingsMatch[1];
      return {
        fr: `Épargne (${percentage}% des revenus)`,
        en: `Savings (${percentage}% earning)`,
        mg: `Tahiry (${percentage}% amin’ny vola azo)`
      }[this.language()];
    }

    const entry = translations.find((translation) =>
      Object.values(translation).includes(value)
    );
    return entry?.[this.language()];
  }

  private getStoredLanguage(): AppLanguage {
    if (typeof localStorage === 'undefined') return 'fr';
    const language = localStorage.getItem(this.storageKey);
    return this.isLanguage(language) ? language : 'fr';
  }

  private isLanguage(language: string | null): language is AppLanguage {
    return language === 'fr' || language === 'en' || language === 'mg';
  }
}
