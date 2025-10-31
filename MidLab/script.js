document.addEventListener('DOMContentLoaded', () => {
	const sections = document.querySelectorAll('.cv-section');

	sections.forEach(section => {
		const title = section.querySelector('.cv-section-title');
		const detailsId = title?.dataset.hoverTarget;
		if (!title || !detailsId) {
			return;
		}

		const details = document.getElementById(detailsId);
		if (!details) {
			return;
		}

		title.setAttribute('role', 'button');
		title.setAttribute('tabindex', '0');
		title.setAttribute('aria-controls', detailsId);
		title.setAttribute('aria-expanded', 'false');
		details.setAttribute('aria-hidden', 'true');

		const isLocked = () => section.dataset.locked === 'true';
		const setLocked = locked => {
			if (locked) {
				section.dataset.locked = 'true';
			} else {
				delete section.dataset.locked;
			}
		};

		const setExpanded = expanded => {
			section.classList.toggle('is-active', expanded);
			title.setAttribute('aria-expanded', expanded ? 'true' : 'false');
			details.setAttribute('aria-hidden', expanded ? 'false' : 'true');
			details.style.maxHeight = expanded ? `${details.scrollHeight}px` : '0px';
		};

		const open = ({ lock = false } = {}) => {
			setExpanded(true);
			if (lock) {
				setLocked(true);
			}
		};

		const close = ({ unlock = false } = {}) => {
			if (unlock) {
				setLocked(false);
			}
			setExpanded(false);
		};

		section.addEventListener('mouseenter', () => {
			if (isLocked()) {
				return;
			}
			setExpanded(true);
		});

		section.addEventListener('mouseleave', () => {
			if (isLocked()) {
				return;
			}
			setExpanded(false);
		});

		title.addEventListener('focus', () => {
			if (isLocked()) {
				return;
			}
			setExpanded(true);
		});

		title.addEventListener('blur', () => {
			if (isLocked()) {
				return;
			}
			setExpanded(false);
		});

		title.addEventListener('click', event => {
			event.preventDefault();
			if (isLocked()) {
				close({ unlock: true });
			} else {
				open({ lock: true });
			}
		});

		title.addEventListener('keydown', event => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				title.click();
			}
		});

		close();
	});

	if ('ResizeObserver' in window) {
		const observer = new ResizeObserver(entries => {
			entries.forEach(entry => {
				const details = entry.target;
				const section = details.closest('.cv-section');
				if (!section || !section.classList.contains('is-active')) {
					return;
				}

				details.style.maxHeight = `${details.scrollHeight}px`;
			});
		});

		document
			.querySelectorAll('.cv-section-details')
			.forEach(details => observer.observe(details));
	}
});
