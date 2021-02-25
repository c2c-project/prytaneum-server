import passport from 'passport';
import { Strategy as LocalStrategy, IStrategyOptions, VerifyFunction as LocalVerifyCallback } from 'passport-local';

import { verifyPassword } from 'modules/user';
import { useCollection } from 'db';
import createHttpError from 'http-errors';

export const localOptions: IStrategyOptions = { usernameField: 'email' };
export const localCallback: LocalVerifyCallback = (email: string, password: string, done) => {
    async function verify(): Promise<void> {
        try {
            // generic error -- we don't want to specifically tell them if the email or password was incorrect
            const err = createHttpError(401, 'Email or password is incorrect');
            const user = await useCollection('Users', (Users) =>
                Users.findOne({
                    'email.address': email,
                })
            );
            // user does not exist
            if (!user) throw err;
            if (!user.password) throw createHttpError(401);
            const isVerified = await verifyPassword(password, user.password);

            // password does not match
            if (!isVerified) throw err;

            // update last login for this user
            await useCollection('Users', (Users) =>
                Users.updateOne({ _id: user._id }, { $set: { 'meta.lastLogin': new Date() } })
            );
            // password matches and we're good to go
            done(null, user);
        } catch (err) {
            // some error happened somewhere
            done(err, false);
        }
    }

    // eslint-disable-next-line no-void
    void verify();
};

export default function configure() {
    passport.use('login', new LocalStrategy(localOptions, localCallback));
}
