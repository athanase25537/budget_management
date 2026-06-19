export class SettingsModel {
    constructor(
        public id: number,
        public economy: number,
        public min_val_stat: number,
        public max_val_stat: number,
        public increment: number,
        public user_id: number
    ) { }
  }