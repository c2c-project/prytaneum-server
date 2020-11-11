import passport from 'passport';
import {
    Strategy as LocalStrategy,
    IStrategyOptions,
    VerifyFunction as LocalVerifyCallback,
} from 'passport-local';

import { verifyPassword } from 'modules/user';
import { useCollection } from 'db';

export const localOptions: IStrategyOptions = { usernameField: 'email' };
export const localCallback: LocalVerifyCallback = (
    email: string,
    password: string,
    done
) => {
    async function verify(): Promise<void> {
        try {
            const user = await useCollection('Users', (Users) =>
                Users.findOne({
                    'email.address': email,
                })
            );
            if (!user) {
                // user does not exist
                done(null, false);
            } else {
                const isVerified = await verifyPassword(
                    password,
                    user.password
                );

                // password does not match
                if (!isVerified) {
                    done(null, false);
                }

                // update last login for this user
                await useCollection('Users', (Users) =>
                    Users.updateOne(
                        { _id: user._id },
                        { $set: { 'meta.lastLogin': new Date() } }
                    )
                );
                // password matches and we're good to go
                done(null, user);
            }
        } catch (e) {
            // some error happened somewhere
            done(e);
        }
    }

    // eslint-disable-next-line no-void
    void verify();
};

export default function configure() {
    passport.use('login', new LocalStrategy(localOptions, localCallback));
}
