import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

/*
Helper function that creates a single SplitText instance and then allows you to create
as many animations of that SplitText as you want, and it'll dynamically update them when
the SplitText instance splits (responsive). It adds an animate() function that you pass a
function that creates (AND RETURNS!) your animation that you can place into timelines, like:

let split = SplitTextAnimator(target, {type: "words,lines", autoSplit: true});
let tl = gsap.timeline();
tl.add( split.animate((self) => {
	return gsap.to(self.words, {...});
})
.add( split.animate((self) => {
    return gsap.to(self.words, {...});
});
*/
export interface SplitTextAnimatorInstance extends SplitText {
    animate: (create: (self: SplitText) => gsap.core.Animation) => gsap.core.Animation;
    clearAnimations: () => void;
}

export const SplitTextAnimator = (target: gsap.DOMTarget, config: SplitText.Vars): SplitTextAnimatorInstance => {
    const originalOnSplit = config.onSplit,
        subscribers: { rebuild: (self: SplitText) => void; kill: () => void }[] = [],
        self = SplitText.create(target, {
            ...config,
            autoSplit: true,
            onSplit(self) {
                // Prepare masks and styles before recreating their animations.
                originalOnSplit?.(self);
                subscribers.forEach(({ rebuild }) => rebuild(self));
            },
        }) as SplitTextAnimatorInstance;

    self.animate = (create: (self: SplitText) => gsap.core.Animation) => {
        const context = gsap.context();
        let animation: gsap.core.Animation;

        const onSplit = (self: SplitText) => {
            const parent = animation?.parent;
            const startTime = animation?.startTime() ?? 0;
            const totalTime = animation?.totalTime() ?? 0;
            const paused = animation?.paused() ?? false;
            animation?.kill();

            const rebuild = () => {
                animation = create(self);
                if (parent) parent.add(animation, startTime);
                else animation.totalTime(totalTime, true);
                animation.paused(paused);
            };
            // Automatic re-splits run outside the original component context.
            if (context) context.add(rebuild);
            else rebuild();
        };

        subscribers.push({ rebuild: onSplit, kill: () => animation?.kill() });
        onSplit(self);

        return animation!;
    };

    // End a transition before registering the next one. Keep the SplitText alive.
    self.clearAnimations = () => {
        subscribers.forEach(({ kill }) => kill());
        subscribers.length = 0;
    };

    return self;
};
