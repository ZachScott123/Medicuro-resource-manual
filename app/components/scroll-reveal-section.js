"use client";

import { useEffect, useRef, useState } from "react";

export default function ScrollRevealSection({ children, className = "", ...props }) {
	const sectionRef = useRef(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const section = sectionRef.current;
		if (!section) return;

		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setIsVisible(true);
				observer.disconnect();
			}
		});

		observer.observe(section);
		return () => observer.disconnect();
	}, []);

	return (
		<section
			ref={sectionRef}
			className={`${className}${isVisible ? " is-visible" : ""}`}
			{...props}
		>
			{children}
		</section>
	);
}
