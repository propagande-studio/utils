import { ref, toRef, type MaybeRef } from "vue";
import { useFrame } from "./useTicker";
import { P } from "../../shared/utils";

export type DampedOpts = {
    target?: MaybeRef<number>;
    damped?: MaybeRef<number>;
    lambda?: MaybeRef<number>;
    decimal?: number
};

export const useDampedValue = ({ target = ref(0), damped = ref(0), lambda = ref(8), decimal }: DampedOpts = {}) => {
    target = toRef(target);
    lambda = toRef(lambda);
    damped = toRef(damped);

    useFrame(({ dt }) => {
        if (damped.value === target.value) return

        damped.value = P.Damp(damped.value, target.value, lambda.value, dt);

        if (decimal === undefined) return

        if (Math.abs(damped.value - target.value) < 10 ** -decimal) damped.value = target.value
    });

    return { target, damped };
};

export type SpringOpts = {
    target?: MaybeRef<number>;
    damped?: MaybeRef<number>;
    velocity?: MaybeRef<number>;
    damping?: MaybeRef<number>;
    stiffness?: MaybeRef<number>;
    useCriticalDamping?: boolean;
};

export const useSpring = ({
    target = ref(0),
    damped = ref(0),
    velocity = ref(0),
    damping = ref(0.5),
    stiffness = ref(50),
    useCriticalDamping = false,
}: SpringOpts = {}) => {
    target = toRef(target);
    damped = toRef(damped);
    velocity = toRef(velocity);
    damping = toRef(damping);
    stiffness = toRef(stiffness);

    const force = ref(0);

    if (useCriticalDamping) {
        damping.value = 2 * Math.sqrt(stiffness.value);
    }

    useFrame(({ dt }) => {
        force.value = (target.value - damped.value) * stiffness.value;
        force.value -= velocity.value * damping.value;
        velocity.value += force.value * dt;
        damped.value += velocity.value * dt;
    });

    return { target, damped, velocity, stiffness };
};
