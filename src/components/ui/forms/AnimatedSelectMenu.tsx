import { components, MenuProps, GroupBase } from "react-select";
import { motion, AnimatePresence } from "framer-motion";

// Make it generic over Option and isMulti
export function AnimatedSelectMenu<Option, IsMulti extends boolean = false>(
    props: MenuProps<Option, IsMulti, GroupBase<Option>>
) {
    return (
        <AnimatePresence>
            {props.selectProps.menuIsOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                >
                    <components.Menu {...props} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
