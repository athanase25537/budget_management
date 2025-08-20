export class TransactionModel {
    constructor(
        public date:string,
        public amount: number,
        public is_in: boolean,
        public id: number,
        public user_id: number,
        public reason: string
    ) { }
}