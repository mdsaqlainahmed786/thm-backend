// quick-test.ts (temp)
import EmailNotificationService from "./services/EmailNotificationService";
(async () => {
  const svc = new EmailNotificationService();
  await svc.sendEmailOTP(123456, "cartcrazeofficial786@gmail.com", "verify-email");
  console.log("Sent.");
})();
