import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useEffect } from "react";

export function AnimatedNumberCounter ({ value }: { value: number }) {
    // Animación de contador de números
    const count = useMotionValue(0);
    const spring = useSpring(count, { stiffness: 100, damping: 10 }); // stiffness: animation acceleration, damping: animation deceleration
    const rounded = useTransform(spring, (latest) => Math.round(latest));

    useEffect(() => {
        count.set(value);
    }, [value, count]);

    return (
        <motion.span>
            {rounded}
        </motion.span>
    );
}
