"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profession = exports.BookedFor = exports.Environment = exports.BedType = exports.MealPlan = exports.RoomType = exports.CurrencyCode = exports.Language = exports.InsightType = exports.ContentType = exports.Role = void 0;
var Role;
(function (Role) {
    Role["USER"] = "user";
    Role["ADMINISTRATOR"] = "administrator";
    Role["OFFICIAL"] = "official";
    Role["MODERATOR"] = "moderator"; //Moderators have the ability to manage comments and prevent spam or inappropriate content post but do not have full access to account settings or posting.
})(Role || (exports.Role = Role = {}));
var ContentType;
(function (ContentType) {
    ContentType["POST"] = "post";
    ContentType["STORY"] = "story";
    ContentType["ANONYMOUS"] = "anonymous";
    ContentType["USER"] = "user";
    ContentType["COMMENT"] = "comment";
})(ContentType || (exports.ContentType = ContentType = {}));
var InsightType;
(function (InsightType) {
    InsightType["WEBSITE_REDIRECTION"] = "website-redirection";
    InsightType["ACCOUNT_REACH"] = "account-reach";
})(InsightType || (exports.InsightType = InsightType = {}));
var Language;
(function (Language) {
    Language["English"] = "en";
    Language["Hindi"] = "hi";
    Language["Gujarati"] = "gu";
    Language["Kannada"] = "kn";
    Language["Marathi"] = "mr";
    Language["Telugu"] = "te";
})(Language || (exports.Language = Language = {}));
var CurrencyCode;
(function (CurrencyCode) {
    CurrencyCode["INR"] = "INR";
})(CurrencyCode || (exports.CurrencyCode = CurrencyCode = {}));
var RoomType;
(function (RoomType) {
    RoomType["SINGLE"] = "single";
    RoomType["DOUBLE"] = "double";
    RoomType["SUITE"] = "suite";
    RoomType["FAMILY"] = "family";
    RoomType["SUPER_DELUXE"] = "super-deluxe";
    RoomType["DELUXE"] = "deluxe";
})(RoomType || (exports.RoomType = RoomType = {}));
var MealPlan;
(function (MealPlan) {
    MealPlan["BREAKFAST"] = "breakfast";
    MealPlan["LUNCH"] = "lunch";
    MealPlan["DINNER"] = "dinner";
    MealPlan["FULL_BOARD"] = "full board";
    MealPlan["BREAKFAST_OR_LUNCH"] = "breakfast or lunch";
    MealPlan["LUNCH_OR_DINNER"] = "lunch or dinner";
    MealPlan["BREAKFAST_OR_DINNER"] = "breakfast or dinner";
    MealPlan["NOT_INCLUDED"] = "not included";
    MealPlan["ALL_INCLUSIVE"] = "all inclusive";
})(MealPlan || (exports.MealPlan = MealPlan = {}));
var BedType;
(function (BedType) {
    BedType["KING"] = "king";
    BedType["QUEEN"] = "queen";
    BedType["SINGLE"] = "single";
    BedType["DOUBLE"] = "double";
})(BedType || (exports.BedType = BedType = {}));
// One-Time Product Notification
var OneTimeProductNotification$NotificationType;
(function (OneTimeProductNotification$NotificationType) {
    OneTimeProductNotification$NotificationType[OneTimeProductNotification$NotificationType["ONE_TIME_PRODUCT_PURCHASED"] = 1] = "ONE_TIME_PRODUCT_PURCHASED";
    OneTimeProductNotification$NotificationType[OneTimeProductNotification$NotificationType["ONE_TIME_PRODUCT_CANCELED"] = 2] = "ONE_TIME_PRODUCT_CANCELED";
})(OneTimeProductNotification$NotificationType || (OneTimeProductNotification$NotificationType = {}));
// Subscription Notification
var SubscriptionNotification$NotificationType;
(function (SubscriptionNotification$NotificationType) {
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_RECOVERED"] = 1] = "SUBSCRIPTION_RECOVERED";
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_RENEWED"] = 2] = "SUBSCRIPTION_RENEWED";
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_CANCELED"] = 3] = "SUBSCRIPTION_CANCELED";
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_PURCHASED"] = 4] = "SUBSCRIPTION_PURCHASED";
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_ON_HOLD"] = 5] = "SUBSCRIPTION_ON_HOLD";
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_IN_GRACE_PERIOD"] = 6] = "SUBSCRIPTION_IN_GRACE_PERIOD";
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_RESTARTED"] = 7] = "SUBSCRIPTION_RESTARTED";
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_PRICE_CHANGE_CONFIRMED"] = 8] = "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED";
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_DEFERRED"] = 9] = "SUBSCRIPTION_DEFERRED";
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_PAUSED"] = 10] = "SUBSCRIPTION_PAUSED";
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED"] = 11] = "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED";
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_REVOKED"] = 12] = "SUBSCRIPTION_REVOKED";
    SubscriptionNotification$NotificationType[SubscriptionNotification$NotificationType["SUBSCRIPTION_EXPIRED"] = 13] = "SUBSCRIPTION_EXPIRED";
})(SubscriptionNotification$NotificationType || (SubscriptionNotification$NotificationType = {}));
var Environment;
(function (Environment) {
    Environment["DEVELOPMENT"] = "development";
    Environment["PRODUCTION"] = "production";
})(Environment || (exports.Environment = Environment = {}));
var BookedFor;
(function (BookedFor) {
    BookedFor["FOR_MYSELF"] = "myself";
    BookedFor["FOR_SOMEONE_ELSE"] = "someone-else";
})(BookedFor || (exports.BookedFor = BookedFor = {}));
var Profession;
(function (Profession) {
    Profession["BUSINESS_PERSON_MAN"] = "Business Person/ Man";
    Profession["GOVERNMENT_SECTOR_EMPLOYEE"] = "Government Sector/ Employee";
    Profession["SELF_EMPLOYEE_PRIVATE_JOB"] = "Self Employee/ Private Job";
    Profession["BELONGS_TO_HOTEL_INDUSTRY"] = "Belongs To Hotel Industry";
    Profession["OTHERS"] = "Others";
})(Profession || (exports.Profession = Profession = {}));
