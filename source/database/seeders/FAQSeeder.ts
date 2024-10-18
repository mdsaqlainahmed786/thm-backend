import { AppConfig } from "../../config/constants";
import FAQ from "../models/faq.model";
const faqs = [
    //General 
    {
        question: `What is ${AppConfig.APP_NAME}?`,
        answer: `${AppConfig.APP_NAME} is a social media platform that allows users to share photos, videos, and Stories, connect with friends, and discover content from around the world.`,
        isPublished: true,
        type: "general",
    },
    {
        question: `How do I download the ${AppConfig.APP_NAME} app?`,
        answer: `You can download the ${AppConfig.APP_NAME} app from the Apple App Store (for iOS devices) or the Google Play Store (for Android devices). Simply search for "${AppConfig.APP_NAME}" and click "Install."`,
        isPublished: true,
        type: "general",
    },
    {
        question: `Is ${AppConfig.APP_NAME} free to use?`,
        answer: `Yes, ${AppConfig.APP_NAME} is free for end users, but businesses will need to pay for certain features. It also offers in-app purchases for options like events and unlimited content posting`,
        isPublished: true,
        type: "general",
    },
    {
        question: `What types of content can I share on ${AppConfig.APP_NAME}?`,
        answer: `You can share photos, videos, Stories, Event and reviews content. You can also post carousel posts that contain multiple images or videos.`,
        isPublished: true,
        type: "general",
    },
    {
        question: `How does the ${AppConfig.APP_NAME} algorithm work?`,
        answer: `The ${AppConfig.APP_NAME} algorithm prioritizes content based on user engagement, relationships, and recency. It aims to show users posts that are most relevant to them.`,
        isPublished: true,
        type: "general",
    },
    {
        question: `How does the ${AppConfig.APP_NAME} algorithm work?`,
        answer: `The ${AppConfig.APP_NAME} algorithm prioritizes content based on user engagement, relationships, and recency. It aims to show users posts that are most relevant to them.`,
        isPublished: true,
        type: "general",
    },
    {
        question: `How do I follow someone on ${AppConfig.APP_NAME}?`,
        answer: `To follow someone, go to their profile and click the "Follow" button. You can also find users through search or by exploring suggested accounts.`,
        isPublished: true,
        type: "general",
    },
    {
        question: `What is the difference between a personal and business account?`,
        answer: `A personal account is designed for individual users, while a business account offers features like analytics, posting events.`,
        isPublished: true,
        type: "general",
    },
    {
        question: `What should I do if I’m having trouble logging in?`,
        answer: `If you're having trouble logging in, check if you're using the correct email and password. If you forgot your password, click "Forgot password?" on the login page to reset it. If issues persist, visit ${AppConfig.APP_NAME}'s Help Center for further assistance.`,
        isPublished: true,
        type: "general",
    },
    //Account 
    {
        question: `How do I create an account on ${AppConfig.APP_NAME}?`,
        answer: `To create an account, click on the "Sign Up" button on the app's welcome screen. You can register using your email address, Google account, or social media profiles like Facebook or Apple ID.`,
        isPublished: true,
        type: "account",
    },
    {
        question: `How do I reset my password?`,
        answer: `If you've forgotten your password, click on 'Forgot Password?' on the login screen. Enter your registered email address, and we will send you instructions to reset your password.`,
        isPublished: true,
        type: "account",
    },
    {
        question: `How can I update my profile information?`,
        answer: `Navigate to the 'Profile' tab and tap on 'Edit Profile.' From there, you can update your bio, profile picture, and other personal information. Be sure to save your changes when you're done.`,
        isPublished: true,
        type: "account",
    },
    {
        question: `How can I make my ${AppConfig.APP_NAME} account private?`,
        answer: `To make your account private, go to your profile, tap on the setting icon in the top right corner and Toggle the "Private Account" option to enable it.`,
        isPublished: true,
        type: "account",
    },
    //Content
    {
        question: `How do I post a hotel review?`,
        answer: `To post a review, find the hotel you stayed at using the search bar. On the hotel's profile, click 'Write a Review.' Rate your experience from 1 to 5 stars and add any comments and photos`,
        isPublished: true,
        type: "content",
    },
    {
        question: `How do I upload photos to my review?`,
        answer: `During the review process, use the 'Add Photos' button to upload images from your device's gallery or take new photos. Ensure that your photos meet our content guidelines.`,
        isPublished: true,
        type: "content",
    },
    {
        question: `How do I create a Story?`,
        answer: `To create a Story, Tap the profile from your home feed. Capture a photo or video, or select one from your gallery. You can then add text, stickers, and effects before posting.`,
        isPublished: true,
        type: "content",
    },
    {
        question: `What are ${AppConfig.APP_NAME}'s content guidelines?`,
        answer: `${AppConfig.APP_NAME}’s content guidelines prohibit hate speech, nudity, graphic violence, and spam. Make sure your content adheres to these guidelines to avoid removal or account suspension.`,
        isPublished: true,
        type: "content",
    },
    {
        question: `What should I do if my content gets removed?`,
        answer: `If your content is removed, check ${AppConfig.APP_NAME}'s community guidelines to understand why. You can appeal the decision by following the instructions provided in the notification you received.`,
        isPublished: true,
        type: "content",
    },
    //Privacy
    {
        question: `What information does ${AppConfig.APP_NAME} collect from me?`,
        answer: ` ${AppConfig.APP_NAME} collects various data, including your profile information, posts, interactions, device information, and location data. This helps improve the app and personalize your experience.`,
        isPublished: true,
        type: "privacy",
    },
    {
        question: `Can I control who sees my posts and stories?`,
        answer: `Yes, if your account is private, only your approved followers can see your posts and stories. You can also create close friends lists for stories to share with a select group.`,
        isPublished: true,
        type: "privacy",
    },
    {
        question: `How do I manage my privacy settings?`,
        answer: `Go to your profile, tap on the setting icon in the top right corner and Toggle the "Private Account" option to enable it.`,
        isPublished: true,
        type: "privacy",
    },
    {
        question: `What should I do if someone is harassing me on ${AppConfig.APP_NAME}?`,
        answer: `If someone is harassing you, you can block them, report their account, or adjust your privacy settings. To block someone, go to their profile, tap the three dots in the top right corner, and select "Block."`,
        isPublished: true,
        type: "privacy",
    },
    {
        question: `How can I block or unfriend someone?`,
        answer: `To block someone, go to their profile, tap the three dots in the top right corner, and select "Block." To unfriend someone, simply unfollow them from their profile.`,
        isPublished: true,
        type: "privacy",
    },
    {
        question: `How do I report a privacy violation?`,
        answer: `To report a privacy violation, go to the user's profile, tap the three dots in the top right corner, and select "Report." Follow the prompts to report the issue.`,
        isPublished: true,
        type: "privacy",
    },
    {
        question: `How can I delete my data from ${AppConfig.APP_NAME}?`,
        answer: `To delete your data, you can either temporarily deactivate your account or permanently delete it. Go to your account settings and select 'Deactivate Account' for temporary deletion or 'Delete Account' for permanent deletion.`,
        isPublished: true,
        type: "privacy",
    },
]
class FAQSeeder {
    async shouldRun() {
        const count = await FAQ.countDocuments().exec();
        return count === 0;
    }
    async run() {
        return FAQ.create(faqs);
    }
}

export default FAQSeeder;