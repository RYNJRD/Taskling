import { Resend } from "resend";
import { getEnv } from "../env";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");
const FROM_EMAIL = "Taskling <hello@contact.taskling.co>";

function getFooter(isMarketing: boolean) {
  if (!isMarketing) return "";
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px dashed #ffe4e6; text-align: center; color: #64748b; font-size: 12px;">
      <p>You are receiving this because you use Taskling, the chore app for families.</p>
      <p><a href="{{unsubscribe_url}}" style="color: #64748b; text-decoration: underline;">Unsubscribe from weekly summaries</a></p>
    </div>
  `;
}

function getBaseTemplate(title: string, content: string, isMarketing = false) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Comic Sans MS', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; background-color: #f8fafc; color: #334155;">
      <div style="max-w-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 4px solid #fff0f2;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 1px; text-shadow: 2px 2px 0px rgba(0,0,0,0.1);">⭐ Taskling ⭐</h1>
        </div>

        <!-- Body -->
        <div style="padding: 40px 30px;">
          ${content}
          ${getFooter(isMarketing)}
        </div>
        
      </div>
    </body>
    </html>
  `;
}

export async function sendWelcomeEmail(to: string, parentName: string) {
  const subject = "Welcome to Taskling! 🌟";
  const html = getBaseTemplate(subject, `
    <h2 style="color: #a855f7; font-size: 24px; margin-top: 0;">Hi ${parentName}! 👋</h2>
    <p style="font-size: 16px; line-height: 1.6;">We're so excited to have you and your family join Taskling. Get ready to turn chores into fun adventures and reward your kids for their hard work!</p>
    <p style="font-size: 16px; line-height: 1.6;">Start by adding your kids, setting up their first chores, and choosing some cool rewards.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://taskling.co" style="background: linear-gradient(135deg, #a855f7 0%, #d946ef 100%); color: white; padding: 14px 32px; border-radius: 99px; text-decoration: none; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 14px rgba(168, 85, 247, 0.4);">Let's go! 🚀</a>
    </div>
  `);
  
  const text = `Hi ${parentName}! Welcome to Taskling. We're excited to have your family join us. Start by setting up your first chores today! `;

  try {
    const data = await resend.emails.send({ from: FROM_EMAIL, to, subject, html, text });
    console.log("[Email] Welcome email sent successfully:", data.id);
    return data;
  } catch (error) {
    console.error("[Email] Failed to send welcome email:", error);
    return null;
  }
}


export async function sendOtpEmail(to: string, code: string) {
  const subject = "Your Taskling verification code 🔑";

  // Penguin SVG inline (waving pose, small, for email)
  const penguinSvg = `<svg width="90" height="100" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="114" rx="24" ry="5" fill="rgba(0,0,0,0.10)"/>
    <path d="M18 72 C18 44 30 18 50 18 C70 18 82 44 82 72 C82 96 68 112 50 112 C32 112 18 96 18 72Z" fill="#1a1a2e"/>
    <ellipse cx="50" cy="76" rx="21" ry="26" fill="#f0f0f5"/>
    <path d="M18 72 C10 68 8 82 14 88 Q18 90 22 88 L22 68Z" fill="#141428"/>
    <path d="M78 72 C84 58 96 52 100 40 Q100 32 94 34 C90 36 82 50 78 68Z" fill="#141428"/>
    <ellipse cx="38" cy="112" rx="10" ry="5" fill="#FFB300"/>
    <ellipse cx="62" cy="112" rx="10" ry="5" fill="#FFB300"/>
    <circle cx="37" cy="58" r="8.5" fill="white"/>
    <circle cx="39" cy="56" r="5.5" fill="#1a1a2e"/>
    <circle cx="41" cy="54" r="2" fill="white"/>
    <circle cx="63" cy="58" r="8.5" fill="white"/>
    <circle cx="65" cy="56" r="5.5" fill="#1a1a2e"/>
    <circle cx="67" cy="54" r="2" fill="white"/>
    <ellipse cx="27" cy="68" rx="6" ry="4" fill="#FFB3B3" opacity="0.65"/>
    <ellipse cx="73" cy="68" rx="6" ry="4" fill="#FFB3B3" opacity="0.65"/>
    <path d="M45 73 Q50 80 55 73 L54 70 Q50 74 46 70 Z" fill="#FFB300"/>
    <path d="M39 80 Q50 92 61 80" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M24 78 Q50 88 76 78 L78 84 Q50 96 22 84 Z" fill="#7C3AED"/>
    <rect x="22" y="80" width="10" height="7" rx="3" fill="#5b21b6"/>
    <text x="62" y="89" font-size="8" text-anchor="middle" fill="#FFD700">★</text>
  </svg>`;

  const html = getBaseTemplate(subject, `
    <div style="text-align: center; margin-bottom: 24px;">
      ${penguinSvg}
    </div>
    <h2 style="color: #7C3AED; font-size: 26px; margin-top: 0; text-align: center; font-weight: 800;">Here's your code! 🎉</h2>
    <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #475569;">
      Enter this 6-digit code in the Taskling app to verify your account.<br/>
      <strong>It expires in 10 minutes.</strong>
    </p>

    <div style="background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%); border-radius: 20px; padding: 32px 20px; margin: 28px 0; text-align: center; border: 3px solid #7C3AED;">
      <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #7C3AED; letter-spacing: 3px; text-transform: uppercase;">Your verification code</p>
      <div style="display: inline-flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        ${code.split("").map(d => `<span style="display:inline-block;width:48px;height:64px;background:white;border-radius:14px;font-size:36px;font-weight:900;color:#1a1a2e;line-height:64px;text-align:center;box-shadow:0 4px 12px rgba(124,58,237,0.2);border:2px solid #c4b5fd;">${d}</span>`).join("")}
      </div>
      <p style="margin: 16px 0 0 0; font-size: 13px; color: #94a3b8;">Didn't request this? You can safely ignore this email.</p>
    </div>

    <p style="font-size: 14px; text-align: center; color: #64748b;">
      Once verified you'll be taken straight into your family's Taskling space. ⭐
    </p>
  `);

  const text = `Your Taskling verification code is: ${code}\n\nIt expires in 10 minutes. If you didn't request this, ignore this email.`;

  try {
    const data = await resend.emails.send({ from: FROM_EMAIL, to, subject, html, text });
    console.log("[Email] OTP email sent:", data.id);
    return data;
  } catch (error) {
    console.error("[Email] Failed to send OTP email:", error);
    return null;
  }
}



export async function sendPasswordResetEmail(to: string, link: string) {
  const subject = "Reset your Taskling password 🔒";
  const html = getBaseTemplate(subject, `
    <h2 style="color: #a855f7; font-size: 24px; margin-top: 0;">Forgot your password? 🤔</h2>
    <p style="font-size: 16px; line-height: 1.6;">No worries! It happens to the best of us. Click the button below to choose a new password.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${link}" style="background-color: #f43f5e; color: white; padding: 14px 32px; border-radius: 99px; text-decoration: none; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 14px rgba(244, 63, 94, 0.4);">Reset Password 🔑</a>
    </div>
    <p style="font-size: 14px; color: #94a3b8; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
  `);
  
  const text = `Reset your Taskling password by visiting this link: ${link} \nIf you didn't request this, ignore this email.`;

  try {
    const data = await resend.emails.send({ from: FROM_EMAIL, to, subject, html, text });
    console.log("[Email] Password reset email sent successfully:", data.id);
    return data;
  } catch (error) {
    console.error("[Email] Failed to send password reset email:", error);
    return null;
  }
}

export async function sendChoreCompletedEmail(to: string, parentName: string, childName: string, choreName: string) {
  const subject = `${childName} completed a chore! 🎉`;
  const html = getBaseTemplate(subject, `
    <h2 style="color: #10b981; font-size: 24px; margin-top: 0;">Woohoo! 🙌</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hi ${parentName}, great news! <strong>${childName}</strong> just finished marking a chore as complete:</p>
    <div style="background-color: #ecfdf5; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0; border: 2px dashed #34d399;">
      <strong style="color: #059669; font-size: 20px;">🧹 ${choreName}</strong>
    </div>
    <p style="font-size: 16px; line-height: 1.6;">Time to review and approve their hard work so they can earn their stars! ⭐</p>
  `);
  
  const text = `Hi ${parentName}, ${childName} just finished their chore: "${choreName}". Log in to review and approve it!`;

  try {
    const data = await resend.emails.send({ from: FROM_EMAIL, to, subject, html, text });
    console.log("[Email] Chore completed email sent successfully:", data.id);
    return data;
  } catch (error) {
    console.error("[Email] Failed to send chore completed email:", error);
    return null;
  }
}

export async function sendRewardClaimedEmail(to: string, parentName: string, childName: string, rewardName: string) {
  const subject = `${childName} wants to claim a reward! 🎁`;
  const html = getBaseTemplate(subject, `
    <h2 style="color: #f59e0b; font-size: 24px; margin-top: 0;">Reward Time! 🏆</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hi ${parentName}, <strong>${childName}</strong> has been saving up their stars and wants to claim a reward:</p>
    <div style="background-color: #fffbeb; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0; border: 2px dashed #fbbf24;">
      <strong style="color: #b45309; font-size: 20px;">🎁 ${rewardName}</strong>
    </div>
    <p style="font-size: 16px; line-height: 1.6;">Log in to approve the reward and celebrate their awesome effort!</p>
  `);
  
  const text = `Hi ${parentName}, ${childName} wants to claim the reward: "${rewardName}". Log in to approve it!`;

  try {
    const data = await resend.emails.send({ from: FROM_EMAIL, to, subject, html, text });
    console.log("[Email] Reward claimed email sent successfully:", data.id);
    return data;
  } catch (error) {
    console.error("[Email] Failed to send reward claimed email:", error);
    return null;
  }
}

export async function sendWeeklySummaryEmail(to: string, parentName: string, childrenStats: { name: string, choresCompleted: number, starsEarned: number }[]) {
  const subject = "Your Family's Weekly Chore Summary 📊";
  
  const statsHtml = childrenStats.map(stat => `
    <div style="background-color: white; border-radius: 16px; padding: 16px; margin-bottom: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
      <strong style="font-size: 18px; color: #a855f7;">${stat.name}</strong>
      <div style="text-align: right;">
        <span style="display: block; font-size: 14px; color: #64748b;">✅ ${stat.choresCompleted} Chores</span>
        <span style="display: block; font-size: 14px; color: #eab308; font-weight: bold;">⭐ ${stat.starsEarned} Stars</span>
      </div>
    </div>
  `).join('');

  const html = getBaseTemplate(subject, `
    <h2 style="color: #a855f7; font-size: 24px; margin-top: 0;">Weekly Wrap-up 📝</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hi ${parentName}, another great week in the books! Here is how your awesome kids did this week:</p>
    <div style="background-color: #f8fafc; padding: 16px; border-radius: 16px; margin: 20px 0;">
      ${statsHtml || '<p style="text-align: center; color: #94a3b8;">No activity this week. Let\'s get to it!</p>'}
    </div>
    <p style="font-size: 16px; line-height: 1.6;">Keep up the great work inspiring responsibility!</p>
  `, true);
  
  let text = `Hi ${parentName}, another great week in the books! Here's the recap:\n\n`;
  childrenStats.forEach(stat => {
    text += `- ${stat.name}: ${stat.choresCompleted} chores completed, ${stat.starsEarned} stars earned\n`;
  });
  text += "\nYou are receiving this because you use Taskling. To unsubscribe, visit your account settings.";

  try {
    const data = await resend.emails.send({ from: FROM_EMAIL, to, subject, html, text });
    console.log("[Email] Weekly summary email sent successfully:", data.id);
    return data;
  } catch (error) {
    console.error("[Email] Failed to send weekly summary email:", error);
    return null;
  }
}

// Ensure Firebase is initialized to resolve emails
import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { db } from "../db";
import { users } from "../../shared/schema";
import { and, eq } from "drizzle-orm";

function ensureFirebase() {
  if (getApps().length > 0) return;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
}

async function getParentEmails(familyId: number): Promise<{ email: string; name: string }[]> {
  ensureFirebase();
  const parents = await db
    .select()
    .from(users)
    .where(and(eq(users.familyId, familyId), eq(users.role, "parent")));

  const results: { email: string; name: string }[] = [];
  for (const parent of parents) {
    if (parent.firebaseUid) {
      try {
        const fbUser = await getAuth().getUser(parent.firebaseUid);
        if (fbUser.email) {
          results.push({ email: fbUser.email, name: parent.username });
        }
      } catch (err) {
        console.error(`Failed to fetch email for parent ${parent.firebaseUid}`, err);
      }
    }
  }
  return results;
}

export async function notifyParentsOfChoreCompleted(familyId: number, childName: string, choreName: string) {
  const parents = await getParentEmails(familyId);
  for (const parent of parents) {
    await sendChoreCompletedEmail(parent.email, parent.name, childName, choreName);
  }
}

export async function notifyParentsOfRewardClaimed(familyId: number, childName: string, rewardName: string) {
  const parents = await getParentEmails(familyId);
  for (const parent of parents) {
    await sendRewardClaimedEmail(parent.email, parent.name, childName, rewardName);
  }
}

export async function notifyNewParentSignup(uid: string, parentName: string) {
  ensureFirebase();
  try {
    const fbUser = await getAuth().getUser(uid);
    if (fbUser.email) {
      await sendWelcomeEmail(fbUser.email, parentName);
    }
  } catch (err) {
    console.error(`Failed to fetch email for new signup ${uid}`, err);
  }
}

