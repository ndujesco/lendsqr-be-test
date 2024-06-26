import { TransactionI, TransactionType } from './interface.util';

export class Helper {
  static generateWalletAccountNumber(): string {
    let accountNumber = '88';
    for (let i = 0; i < 8; i++) {
      accountNumber += Math.floor(Math.random() * 10);
    }
    return accountNumber;
  }

  static generateRandomOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  static genEmailMessage(input: { name: string; otp: string }): string {
    const { name, otp } = input;
    return `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
      <div style="border-bottom:1px solid #eee">
        <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">DEMO CREDIT.</a>
      </div>
      <p style="font-size:1.1em">Hi, ${name}.</p>
      <p>Thank you for choosing Demo Credit. Here is your OTP:</p>
      <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;"> ${otp}</h2>
      <p style="font-size:0.9em;">Regards, <br />Demo Credit. </p>
      <hr style="border:none;border-top:1px solid #eee" />
      <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300"></div>
    </div>
  </div>`;
  }

  static omitUserInfo(input: any) {
    const { password, otp, created_at, updated_at, ...rest } = input;
    return rest;
  }

  static isValidOtp(input: {
    inputOtp: string;
    generatedOtp: string;
  }): boolean {
    const { inputOtp, generatedOtp } = input;

    return inputOtp === generatedOtp;
  }

  static groupByTransactionType(transactions: TransactionI[]) {
    return transactions.reduce((result, obj) => {
      const type = obj.transaction_type;
      if (!result[type]) {
        result[type] = [];
      }
      result[type].push(obj);
      return result;
    }, {} as Record<TransactionType, TransactionI[]>);
  }

  static removeTransactionFields(
    transactions: TransactionI[],
    user_id: number
  ): TransactionI[] {
    return transactions.map((transaction) => {
      const { sender_balance, receiver_balance, sender, ...rest } = transaction;
      const walletBalance =
        sender === user_id ? sender_balance : receiver_balance;
      return {
        ...rest,
        walletBalance,
      } as TransactionI;
    });
  }
}
