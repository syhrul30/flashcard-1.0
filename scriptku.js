document.addEventListener('DOMContentLoaded', () => {
    // Ambil referensi elemen dari HTML
    const flashcardGrid = document.getElementById('flashcard-grid');
    const countElement = document.getElementById('card-count');
    const searchBar = document.getElementById('search-bar');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    const sortDropdownBtn = document.getElementById('sort-dropdown-btn');
    const sortOptions = document.getElementById('sort-options');
    const sortBtnText = document.getElementById('sort-btn-text');

    const filterDropdownBtn = document.getElementById('filter-dropdown-btn');
    const filterOptions = document.getElementById('filter-options');
    const filterBtnText = document.getElementById('filter-btn-text');

    const scrollTopBtn = document.getElementById('scroll-to-top');

    let allFlashcardData = [];
    let currentFilter = 'all';
    let currentSort = 'initial';

    // Fetch data dari file JSON
    fetch('flashcards.json')
        .then(response => response.json())
        .then(data => {
            allFlashcardData = data; // Simpan data asli
            updateDisplay(); // Tampilkan kartu untuk pertama kali
        })
        .catch(error => {
            console.error('Error fetching flashcard data:', error);
            flashcardGrid.innerHTML = `<p class="no-results" style="color: white; grid-column: 1 / -1;">Gagal memuat data kosakata. Periksa file flashcards.json.</p>`;
        });

    // === LOGIKA TEMA (DARK/LIGHT MODE) ===
    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // === LOGIKA DROPDOWN ===
    function toggleDropdown(menu) {
        // Tutup dropdown lain jika ada yang terbuka
        if (menu === sortOptions) {
            filterOptions.classList.remove('show');
        } else {
            sortOptions.classList.remove('show');
        }
        menu.classList.toggle('show');
    }

    sortDropdownBtn.addEventListener('click', () => toggleDropdown(sortOptions));
    filterDropdownBtn.addEventListener('click', () => toggleDropdown(filterOptions));

    // Tutup dropdown jika klik di luar area
    window.addEventListener('click', (e) => {
        if (!sortDropdownBtn.contains(e.target)) {
            sortOptions.classList.remove('show');
        }
        if (!filterDropdownBtn.contains(e.target)) {
            filterOptions.classList.remove('show');
        }
    });

    // === LOGIKA FILTER, SORTIR, DAN PENCARIAN ===
    searchBar.addEventListener('input', updateDisplay);

    filterOptions.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.classList.contains('dropdown-item')) {
            currentFilter = e.target.dataset.filter;
            filterBtnText.textContent = e.target.textContent;
            filterOptions.classList.remove('show');

            // Update style tombol filter
            const filterClasses = ['filter-active-verb', 'filter-active-noun', 'filter-active-adjective', 'filter-active-adverb'];
            filterDropdownBtn.classList.remove(...filterClasses);
            if(currentFilter !== 'all') {
                filterDropdownBtn.classList.add(`filter-active-${currentFilter}`);
            }

            updateDisplay();
        }
    });

    sortOptions.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.classList.contains('dropdown-item')) {
            currentSort = e.target.dataset.sort;
            sortBtnText.textContent = e.target.textContent;
            sortOptions.classList.remove('show');
            updateDisplay();
        }
    });

    // === FUNGSI UTAMA UNTUK UPDATE TAMPILAN ===
    function updateDisplay() {
        const searchTerm = searchBar.value.toLowerCase().trim();
        
        // Animasi fade out untuk kartu yang ada
        const cardsToAnimateOut = document.querySelectorAll('.flashcard:not(.fade-out)');
        cardsToAnimateOut.forEach(card => card.classList.add('fade-out'));

        const renderNewCards = () => {
            flashcardGrid.innerHTML = '';

            // 1. Filter berdasarkan kategori
            let filteredData = allFlashcardData.filter(data => {
                const types = data.type.split('/');
                return currentFilter === 'all' || types.includes(currentFilter);
            });

            // 2. Filter berdasarkan pencarian
            if (searchTerm) {
                filteredData = filteredData.filter(data =>
                    data.word.toLowerCase().includes(searchTerm) ||
                    data.definition.toLowerCase().includes(searchTerm) ||
                    data.synonym.toLowerCase().includes(searchTerm)
                );
            }

            // 3. Sortir data
            let sortedData = [...filteredData]; // Buat salinan untuk disortir
            switch (currentSort) {
                case 'latest':
                    sortedData.reverse();
                    break;
                case 'az':
                    sortedData.sort((a, b) => a.word.localeCompare(b.word));
                    break;
                case 'za':
                    sortedData.sort((a, b) => b.word.localeCompare(a.word));
                    break;
                case 'random':
                    sortedData.sort(() => Math.random() - 0.5);
                    break;
                // 'initial' tidak perlu diapa-apakan
            }
            
            countElement.textContent = `Menampilkan ${sortedData.length} dari ${allFlashcardData.length} kosakata`;

            if (sortedData.length === 0) {
                flashcardGrid.innerHTML = `<p class="no-results" style="color: white; grid-column: 1 / -1;">Tidak ada kosakata yang cocok.</p>`;
            } else {
                sortedData.forEach(data => {
                    const card = document.createElement('div');
                    let cardColorClasses = '';
                    if (data.type.includes('/')) {
                        const specificClass = data.type.split('/').sort().join('-');
                        cardColorClasses = `multi-category ${specificClass}`;
                    } else {
                        cardColorClasses = data.type;
                    }
                    card.className = `flashcard ${cardColorClasses} fade-in`;
                    card.innerHTML = `
                        <div class="flashcard-inner">
                            <div class="flashcard-face flashcard-front">
                                <span class="word">${data.word}</span>
                            </div>
                            <div class="flashcard-face flashcard-back">
                                <div class="back-content">
                                    <p class="definition">${data.definition}</p>
                                    <p class="synonym"><strong>Sinonim:</strong> ${data.synonym || '-'}</p>
                                    <p class="example"><i>Contoh: "${data.example}"</i></p>
                                </div>
                            </div>
                        </div>
                    `;
                    card.addEventListener('click', () => card.classList.toggle('flipped'));
                    flashcardGrid.appendChild(card);
                });
            }
        };
        
        // Beri waktu untuk animasi fade-out selesai sebelum merender kartu baru
        setTimeout(renderNewCards, cardsToAnimateOut.length > 0 ? 300 : 0);
    }
    
    // === Tombol Scroll To Top ===
    window.onscroll = () => {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    };

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});