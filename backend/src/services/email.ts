export const sendVerificationEmail = async (email, token) => {
  console.log(`Sending verification email to ${email} with token ${token}...`);
  // Mocked email sender for now
  return Promise.resolve(true);
};
