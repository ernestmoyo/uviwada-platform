// ===== LANGUAGE =====
var currentLang = 'sw';

function applyLang() {
    document.querySelectorAll('[data-sw]').forEach(function(el) {
        var text = el.getAttribute('data-' + currentLang);
        if (text) {
            if (el.tagName === 'INPUT') {
                el.placeholder = text;
            } else {
                el.textContent = text;
            }
        }
    });
    // Update toggle button highlights
    var flags = document.querySelectorAll('.lang-flag');
    flags.forEach(function(f) { f.classList.remove('active'); });
    if (currentLang === 'en') {
        flags[0].classList.add('active');
    } else {
        flags[1].classList.add('active');
    }
    document.documentElement.lang = currentLang;
    // Update map popups if map exists
    if (window._mapMarkers) {
        window._mapMarkers.forEach(function(item) {
            item.marker.setPopupContent(buildPopup(item.data));
        });
    }
}

function toggleLang() {
    currentLang = currentLang === 'sw' ? 'en' : 'sw';
    applyLang();
}

// ===== MOBILE MENU =====
function toggleMenu() {
    document.getElementById('navLinks').classList.toggle('open');
}
document.querySelectorAll('.nav-links a').forEach(function(link) {
    link.addEventListener('click', function() {
        document.getElementById('navLinks').classList.remove('open');
    });
});

// ===== NAVBAR SCROLL + ACTIVE SECTION =====
var sections = document.querySelectorAll('section[id]');
function updateNav() {
    var navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    // Active section highlighting
    var scrollPos = window.scrollY + 120;
    sections.forEach(function(sec) {
        var top = sec.offsetTop;
        var bottom = top + sec.offsetHeight;
        var id = sec.getAttribute('id');
        var link = document.querySelector('.nav-links a[href="#' + id + '"]');
        if (link) {
            if (scrollPos >= top && scrollPos < bottom) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        }
    });
}
window.addEventListener('scroll', updateNav);

// ===== STAT COUNTER ANIMATION =====
function animateCounters() {
    document.querySelectorAll('.stat-num[data-count]').forEach(function(el) {
        var target = parseInt(el.getAttribute('data-count'));
        var duration = 1500;
        var startTime = null;
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target).toLocaleString();
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target.toLocaleString();
            }
        }
        requestAnimationFrame(step);
    });
}
var heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    var heroObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                animateCounters();
                heroObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    heroObserver.observe(heroStats);
}

// ===== DASHBOARD TABS =====
function switchDashTab(btn, tab) {
    document.querySelectorAll('.dash-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.dash-content').forEach(function(c) { c.classList.add('hidden'); });
    btn.classList.add('active');
    document.getElementById('dash-' + tab).classList.remove('hidden');
}

// ===== REGISTRATION FORM =====
function handleRegistration(e) {
    e.preventDefault();
    var form = e.target;
    var inputs = form.querySelectorAll('input[required], select[required]');
    var valid = true;
    inputs.forEach(function(inp) {
        if (!inp.value.trim()) {
            inp.style.borderColor = '#ef4444';
            valid = false;
        } else {
            inp.style.borderColor = '#ddd';
        }
    });
    if (!valid) return;
    form.classList.add('hidden');
    document.getElementById('formSuccess').classList.remove('hidden');
}

// ===== MAP POPUP BUILDER =====
var qualityColors = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' };
var qualityLabels = {
    green: { sw: 'Ubora Mzuri', en: 'Good Quality' },
    amber: { sw: 'Unahitaji Kuboresha', en: 'Needs Improvement' },
    red: { sw: 'Chini ya Kiwango', en: 'Below Standard' }
};

function buildPopup(c) {
    var childLabel = currentLang === 'sw' ? 'Watoto' : 'Children';
    var qualLabel = qualityLabels[c.quality][currentLang];
    return '<div style="font-family:Inter,sans-serif;min-width:180px">' +
        '<strong style="font-size:0.95rem">' + c.name + '</strong><br>' +
        '<span style="color:#666;font-size:0.82rem">' + c.ward + '</span><br>' +
        '<div style="margin-top:8px;display:flex;align-items:center;gap:6px">' +
        '<span style="width:10px;height:10px;border-radius:50%;background:' + qualityColors[c.quality] + ';display:inline-block"></span>' +
        '<span style="font-size:0.82rem">' + qualLabel + '</span></div>' +
        '<div style="margin-top:4px;font-size:0.82rem;color:#666">' + childLabel + ': ' + c.children + '</div></div>';
}

// ===== LEAFLET MAP WITH WARD BOUNDARIES =====
function initMap() {
    var map = L.map('mapView', {
        scrollWheelZoom: false,
        zoomControl: true
    }).setView([-6.82, 39.27], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18
    }).addTo(map);

    // District colors for ward boundaries
    var districtColors = {
        'Kinondoni': '#7A2040',
        'Ilala': '#E67E22',
        'Temeke': '#2E86C1',
        'Kigamboni': '#5BAA4A',
        'Ubungo': '#8E44AD'
    };

    // Load ward boundaries GeoJSON
    fetch('dar_wards.geojson')
        .then(function(r) { return r.json(); })
        .then(function(geojson) {
            L.geoJSON(geojson, {
                style: function(feature) {
                    var dist = feature.properties.dist_name || '';
                    return {
                        color: districtColors[dist] || '#999',
                        weight: 1.5,
                        fillColor: districtColors[dist] || '#999',
                        fillOpacity: 0.08,
                        dashArray: '3'
                    };
                },
                onEachFeature: function(feature, layer) {
                    var p = feature.properties;
                    layer.bindTooltip(p.ward_name + ' (' + p.dist_name + ')', {
                        sticky: true,
                        className: 'ward-tooltip'
                    });
                }
            }).addTo(map);
        })
        .catch(function() {
            // GeoJSON not available - map still works with markers
        });

    // Sample member centres — HDLI wards from the proposal
    var centres = [
        // Vingunguti (HDLI)
        { lat: -6.8450, lng: 39.2550, name: 'Mama Amina Daycare', ward: 'Vingunguti', quality: 'green', children: 28 },
        { lat: -6.8520, lng: 39.2480, name: 'Bright Stars Centre', ward: 'Vingunguti', quality: 'amber', children: 18 },
        { lat: -6.8380, lng: 39.2610, name: 'Tumaini Daycare', ward: 'Vingunguti', quality: 'green', children: 32 },
        // Manzese (HDLI)
        { lat: -6.7950, lng: 39.2350, name: 'Furaha Kids', ward: 'Manzese', quality: 'green', children: 22 },
        { lat: -6.7880, lng: 39.2420, name: 'Manzese Community Care', ward: 'Manzese', quality: 'red', children: 35 },
        { lat: -6.8010, lng: 39.2290, name: 'Neema Daycare', ward: 'Manzese', quality: 'amber', children: 15 },
        // Temeke (HDLI)
        { lat: -6.8650, lng: 39.2950, name: 'Upendo Centre', ward: 'Temeke', quality: 'green', children: 26 },
        { lat: -6.8720, lng: 39.2880, name: 'Temeke Stars', ward: 'Temeke', quality: 'amber', children: 20 },
        { lat: -6.8580, lng: 39.3020, name: 'Baraka Daycare', ward: 'Temeke', quality: 'green', children: 24 },
        // Mbagala (HDLI)
        { lat: -6.8900, lng: 39.2800, name: 'Mbagala Kids Hub', ward: 'Mbagala', quality: 'red', children: 40 },
        { lat: -6.8960, lng: 39.2730, name: 'Sunrise Daycare', ward: 'Mbagala', quality: 'amber', children: 19 },
        { lat: -6.8840, lng: 39.2870, name: 'Amani Centre', ward: 'Mbagala', quality: 'green', children: 30 },
        // Kariakoo (HDLI)
        { lat: -6.8180, lng: 39.2700, name: 'Kariakoo Little Ones', ward: 'Kariakoo', quality: 'green', children: 16 },
        { lat: -6.8230, lng: 39.2650, name: 'City Kids Care', ward: 'Kariakoo', quality: 'amber', children: 22 },
        // Kinondoni
        { lat: -6.7700, lng: 39.2600, name: 'Kinondoni Daycare', ward: 'Kinondoni', quality: 'green', children: 25 },
        { lat: -6.7650, lng: 39.2550, name: 'Bahari Kids', ward: 'Kinondoni', quality: 'green', children: 21 },
        { lat: -6.7780, lng: 39.2680, name: 'Tumaini wa Watoto', ward: 'Kinondoni', quality: 'amber', children: 27 },
        // Ilala
        { lat: -6.8250, lng: 39.2500, name: 'Ilala Community Care', ward: 'Ilala', quality: 'green', children: 23 },
        { lat: -6.8300, lng: 39.2420, name: 'Nyota Daycare', ward: 'Ilala', quality: 'red', children: 38 },
        // Kigamboni
        { lat: -6.8500, lng: 39.3200, name: 'Kigamboni Stars', ward: 'Kigamboni', quality: 'amber', children: 17 },
        { lat: -6.8560, lng: 39.3150, name: 'Pwani Kids', ward: 'Kigamboni', quality: 'green', children: 20 },
        // More HDLI areas
        { lat: -6.8100, lng: 39.2200, name: 'Tabata Daycare', ward: 'Tabata', quality: 'green', children: 29 },
        { lat: -6.7800, lng: 39.2800, name: 'Mikocheni Little Stars', ward: 'Mikocheni', quality: 'green', children: 14 },
        { lat: -6.8750, lng: 39.2600, name: 'Kurasini Kids', ward: 'Kurasini', quality: 'amber', children: 33 },
    ];

    window._mapMarkers = [];
    centres.forEach(function(c) {
        var marker = L.circleMarker([c.lat, c.lng], {
            radius: Math.max(6, Math.min(12, c.children / 3)),
            fillColor: qualityColors[c.quality],
            color: '#fff',
            weight: 2,
            fillOpacity: 0.85
        }).addTo(map);
        marker.bindPopup(buildPopup(c));
        window._mapMarkers.push({ marker: marker, data: c });
    });
}

// ===== CHARTS =====
function initCharts() {
    // Quality Distribution — doughnut
    var qualityCtx = document.getElementById('qualityChart');
    if (qualityCtx) {
        new Chart(qualityCtx, {
            type: 'doughnut',
            data: {
                labels: ['Good (Green)', 'Needs Improvement (Amber)', 'Below Standard (Red)'],
                datasets: [{
                    data: [67, 23, 10],
                    backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 11, family: 'Inter' }, padding: 12, usePointStyle: true }
                    }
                },
                cutout: '65%'
            }
        });
    }

    // Membership Growth — line
    var growthCtx = document.getElementById('growthChart');
    if (growthCtx) {
        new Chart(growthCtx, {
            type: 'line',
            data: {
                labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
                datasets: [{
                    label: 'Members',
                    data: [82, 89, 95, 104, 112, 118, 128, 139, 147],
                    borderColor: '#7A2040',
                    backgroundColor: 'rgba(122,32,64,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#7A2040',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 2.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { font: { size: 11, family: 'Inter' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11, family: 'Inter' } }
                    }
                }
            }
        });
    }
}

// ===== INIT — apply language FIRST, then map & charts =====
document.addEventListener('DOMContentLoaded', function() {
    applyLang();
    initMap();
    initCharts();
    updateNav();
});
