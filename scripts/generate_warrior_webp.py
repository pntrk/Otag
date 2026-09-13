import os
import subprocess

units = {
    "mizrakli": {
        "name": "Mızraklı Muhafız",
        "title": "Piyade Savunma Muhafızı",
        "bg_top": "#1a1612",
        "bg_bot": "#0c0a09",
        "glow": "#3b82f6",
        "pedestal": "#292524",
        "details": """
            <!-- 3D Pedestal Platform -->
            <ellipse cx="256" cy="455" rx="170" ry="38" fill="url(#pedestalGlow)" filter="blur(10px)" opacity="0.6"/>
            <ellipse cx="256" cy="450" rx="160" ry="32" fill="#1c1917" stroke="#44403c" stroke-width="3"/>
            <ellipse cx="256" cy="445" rx="145" ry="26" fill="#292524" stroke="#78716c" stroke-width="1.5"/>
            
            <!-- Long Spear in Right Hand (extends high) -->
            <line x1="330" y1="460" x2="360" y2="40" stroke="#78350f" stroke-width="8" stroke-linecap="round"/>
            <line x1="331" y1="460" x2="361" y2="40" stroke="#d97706" stroke-width="2" opacity="0.4"/>
            <!-- Spear Head (Damascus Steel with Blood Groove) -->
            <path d="M 360 40 L 372 85 L 360 110 L 348 85 Z" fill="url(#steelGrad)" stroke="#e2e8f0" stroke-width="2"/>
            <line x1="360" y1="40" x2="360" y2="105" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
            <path d="M 352 110 L 368 110 L 366 125 L 354 125 Z" fill="#92400e"/>
            <!-- Crimson Pennon / Banner Ribbon on Spear -->
            <path d="M 360 110 Q 395 125 430 115 Q 405 140 435 155 Q 390 145 360 125 Z" fill="url(#crimsonGrad)" opacity="0.9"/>

            <!-- Character Body (Full 3D Armored Spearman) -->
            <!-- Shadow under feet -->
            <ellipse cx="256" cy="438" rx="80" ry="18" fill="#000000" opacity="0.75" filter="blur(4px)"/>
            
            <!-- Boots / Greaves with Steel Spatulas -->
            <path d="M 215 375 L 210 430 L 238 433 L 242 380 Z" fill="#1c1917" stroke="#44403c" stroke-width="2"/>
            <path d="M 270 375 L 268 430 L 298 433 L 295 380 Z" fill="#1c1917" stroke="#44403c" stroke-width="2"/>
            <!-- Steel Greaves Shinguards -->
            <path d="M 213 385 Q 225 380 237 385 L 235 420 Q 224 425 212 420 Z" fill="url(#steelGrad)" stroke="#94a3b8" stroke-width="1.5"/>
            <path d="M 271 385 Q 283 380 295 385 L 293 420 Q 282 425 270 420 Z" fill="url(#steelGrad)" stroke="#94a3b8" stroke-width="1.5"/>
            
            <!-- Trousers / Tunic Skirt -->
            <path d="M 200 310 L 215 385 L 295 385 L 310 310 Z" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>
            <!-- Chainmail Hauberk Skirt Layer -->
            <path d="M 205 315 L 218 365 L 292 365 L 305 315 Z" fill="url(#chainmailPattern)" stroke="#64748b" stroke-width="2"/>

            <!-- Heavy Leather/Steel Belt with Brass Buckle & Dagger -->
            <rect x="205" y="300" width="100" height="16" rx="3" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
            <rect x="245" y="297" width="20" height="22" rx="2" fill="url(#goldGrad)" stroke="#b45309" stroke-width="1.5"/>
            <!-- Sheathed Janbiya Dagger on Belt -->
            <path d="M 230 310 Q 220 330 205 340" stroke="#b45309" stroke-width="6" stroke-linecap="round"/>

            <!-- Torso: Ottoman Lamellar / Mirror Armor (Krug/Cevşen) -->
            <path d="M 200 210 Q 255 195 310 210 L 305 305 Q 255 315 205 305 Z" fill="#334155" stroke="#1e293b" stroke-width="2"/>
            <!-- Central Steel Disk (Ayna) with 3D Specular Light -->
            <circle cx="255" cy="255" r="38" fill="url(#steelSphere)" stroke="#cbd5e1" stroke-width="2"/>
            <circle cx="255" cy="255" r="30" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3 3"/>
            <circle cx="245" cy="245" r="10" fill="#ffffff" opacity="0.35" filter="blur(2px)"/>

            <!-- Left Arm & Large Defensive Boss Shield (Round Kalkan) -->
            <ellipse cx="180" cy="275" rx="55" ry="60" fill="url(#shieldLeather)" stroke="#78350f" stroke-width="4"/>
            <!-- Concentric Steel Rings on Shield -->
            <ellipse cx="180" cy="275" rx="42" ry="46" fill="none" stroke="#d97706" stroke-width="3"/>
            <ellipse cx="180" cy="275" rx="28" ry="30" fill="url(#steelGrad)" stroke="#e2e8f0" stroke-width="2"/>
            <!-- Heavy Steel Central Boss Spike -->
            <circle cx="180" cy="275" r="14" fill="url(#goldGrad)" stroke="#fef08a" stroke-width="2"/>
            <circle cx="176" cy="271" r="4" fill="#ffffff" opacity="0.6"/>

            <!-- Right Arm Holding Spear -->
            <path d="M 305 215 Q 330 240 332 290" stroke="#334155" stroke-width="22" stroke-linecap="round"/>
            <circle cx="332" cy="290" r="12" fill="#78350f"/> <!-- Gauntlet holding spear -->

            <!-- Shoulders / Pauldrons -->
            <path d="M 185 205 Q 200 190 220 205 Q 205 225 185 220 Z" fill="url(#steelGrad)" stroke="#cbd5e1" stroke-width="2"/>
            <path d="M 290 205 Q 310 190 325 205 Q 315 225 290 220 Z" fill="url(#steelGrad)" stroke="#cbd5e1" stroke-width="2"/>

            <!-- Head & Conical Helmet with Chain Aventail -->
            <!-- Chainmail Neck Coif -->
            <path d="M 230 155 Q 255 175 280 155 L 290 205 Q 255 215 220 205 Z" fill="url(#chainmailPattern)" stroke="#475569" stroke-width="2"/>
            <!-- Face (Bearded Turkish Warrior) -->
            <ellipse cx="255" cy="150" rx="22" ry="26" fill="#e29578"/>
            <!-- Dark Beard & Mustache -->
            <path d="M 235 155 Q 255 185 275 155 Q 265 178 245 178 Z" fill="#1c1917"/>
            <path d="M 242 153 Q 255 160 268 153" stroke="#1c1917" stroke-width="3" stroke-linecap="round"/>
            <!-- Fierce Eyes & Brow -->
            <path d="M 240 142 L 250 144 M 260 144 L 270 142" stroke="#1c1917" stroke-width="2.5"/>
            <circle cx="245" cy="146" r="2" fill="#1c1917"/>
            <circle cx="265" cy="146" r="2" fill="#1c1917"/>
            
            <!-- Conical Steel Helmet (Miğfer) with Nasal Guard & Plume -->
            <path d="M 228 140 Q 255 75 255 70 Q 255 75 282 140 Z" fill="url(#helmetGrad)" stroke="#e2e8f0" stroke-width="2"/>
            <path d="M 226 140 Q 255 133 284 140 L 284 145 Q 255 138 226 145 Z" fill="url(#goldGrad)" stroke="#b45309" stroke-width="1.5"/>
            <!-- Steel Nasal Bar -->
            <rect x="253" y="132" width="4" height="22" rx="1.5" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>
            <!-- Helmet Finial Spike & Horsehair Tuft -->
            <line x1="255" y1="70" x2="255" y2="50" stroke="#f59e0b" stroke-width="3"/>
            <path d="M 255 50 Q 240 55 235 75 Q 248 68 255 58" fill="#b91c1c" stroke="#991b1b" stroke-width="1"/>
        """
    },
    "kilicli": {
        "name": "Kılıçlı Piyade",
        "title": "Ağır Hücum Kılıç Ustası",
        "bg_top": "#1c1412",
        "bg_bot": "#0a0706",
        "glow": "#ef4444",
        "pedestal": "#3f2018",
        "details": """
            <!-- 3D Pedestal -->
            <ellipse cx="256" cy="455" rx="170" ry="38" fill="url(#pedestalGlow)" filter="blur(10px)" opacity="0.6"/>
            <ellipse cx="256" cy="450" rx="160" ry="32" fill="#1c1917" stroke="#7f1d1d" stroke-width="3"/>
            <ellipse cx="256" cy="445" rx="145" ry="26" fill="#292524" stroke="#dc2626" stroke-width="1.5"/>
            <ellipse cx="256" cy="438" rx="85" ry="18" fill="#000000" opacity="0.75" filter="blur(4px)"/>

            <!-- Stance: Aggressive Forward Melee Combat -->
            <!-- Leather High War Boots -->
            <path d="M 205 370 L 195 432 L 230 435 L 235 375 Z" fill="#291811" stroke="#451a03" stroke-width="2"/>
            <path d="M 280 370 L 285 432 L 320 435 L 310 375 Z" fill="#291811" stroke="#451a03" stroke-width="2"/>
            <!-- Steel Kneepads & Greaves -->
            <ellipse cx="215" cy="375" rx="16" ry="14" fill="url(#steelGrad)" stroke="#cbd5e1" stroke-width="2"/>
            <ellipse cx="295" cy="375" rx="16" ry="14" fill="url(#steelGrad)" stroke="#cbd5e1" stroke-width="2"/>

            <!-- Heavy Wool Tunic & Armored Mail Hauberk -->
            <path d="M 195 295 L 190 380 L 320 380 L 315 295 Z" fill="#7f1d1d" stroke="#450a0a" stroke-width="2"/>
            <path d="M 205 305 L 200 365 L 310 365 L 305 305 Z" fill="url(#chainmailPattern)" stroke="#64748b" stroke-width="2"/>

            <!-- War Belt with Ottoman Brass Plaques & Scabbard -->
            <rect x="195" y="285" width="120" height="18" rx="3" fill="#451a03" stroke="#260f02" stroke-width="2"/>
            <!-- Brass medallions along belt -->
            <circle cx="215" cy="294" r="5" fill="url(#goldGrad)"/>
            <circle cx="235" cy="294" r="5" fill="url(#goldGrad)"/>
            <circle cx="255" cy="294" r="7" fill="url(#goldGrad)" stroke="#fef08a" stroke-width="1"/>
            <circle cx="275" cy="294" r="5" fill="url(#goldGrad)"/>
            <circle cx="295" cy="294" r="5" fill="url(#goldGrad)"/>
            <!-- Sheath hanging on hip -->
            <path d="M 210 295 L 160 410" stroke="#991b1b" stroke-width="9" stroke-linecap="round"/>
            <path d="M 210 295 L 160 410" stroke="url(#goldGrad)" stroke-width="3" stroke-linecap="round"/>

            <!-- Torso: Steel Scale Armor (Zırh Gömlek) -->
            <path d="M 195 195 Q 255 180 315 195 L 315 290 Q 255 300 195 290 Z" fill="#334155" stroke="#1e293b" stroke-width="2.5"/>
            <!-- Overlapping scales effect -->
            <path d="M 210 220 Q 255 210 300 220 M 205 240 Q 255 230 305 240 M 205 260 Q 255 250 305 260 M 210 280 Q 255 270 300 280" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" opacity="0.6"/>

            <!-- Left Arm Holding Steel Buckler / Round War Shield -->
            <ellipse cx="180" cy="245" rx="46" ry="50" fill="url(#steelGrad)" stroke="#e2e8f0" stroke-width="3"/>
            <ellipse cx="180" cy="245" rx="32" ry="35" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
            <circle cx="180" cy="245" r="14" fill="url(#goldGrad)" stroke="#fef08a" stroke-width="2"/>
            <circle cx="176" cy="241" r="5" fill="#ffffff" opacity="0.7"/>

            <!-- Right Arm Raised Wielding the Curved Ottoman Kilij Sword -->
            <path d="M 310 200 Q 355 190 380 140" stroke="#7f1d1d" stroke-width="24" stroke-linecap="round"/>
            <!-- Steel Vambrace on forearm -->
            <path d="M 345 180 L 375 145" stroke="url(#steelGrad)" stroke-width="14" stroke-linecap="round"/>
            <!-- Hand / Gauntlet with Gold Crossguard -->
            <circle cx="380" cy="138" r="13" fill="#451a03"/>
            <rect x="365" y="132" width="30" height="8" rx="3" fill="url(#goldGrad)" transform="rotate(-35 380 136)"/>
            <!-- Iconic Ottoman Kilij Blade with Yalman Raised False Edge -->
            <path d="M 385 130 Q 420 80 435 30 Q 425 25 410 45 Q 395 75 375 125 Z" fill="url(#swordSteel)" stroke="#f8fafc" stroke-width="2"/>
            <line x1="380" y1="125" x2="425" y2="35" stroke="#ffffff" stroke-width="2" opacity="0.9"/>

            <!-- Head & Helmet: Decorated Ottoman Turban-Helmet -->
            <ellipse cx="255" cy="140" rx="24" ry="28" fill="#d97706" opacity="0.8"/>
            <!-- Face -->
            <ellipse cx="255" cy="145" rx="21" ry="24" fill="#e09f67"/>
            <path d="M 235 150 Q 255 180 275 150 Q 265 172 245 172 Z" fill="#0f172a"/> <!-- Black beard -->
            <path d="M 240 148 Q 255 155 270 148" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
            <!-- Eyes -->
            <circle cx="245" cy="140" r="2.5" fill="#0f172a"/>
            <circle cx="265" cy="140" r="2.5" fill="#0f172a"/>

            <!-- Turban Helmet (Sarık Miğfer) -->
            <!-- Wrapped dark red cloth turban around helmet rim -->
            <ellipse cx="255" cy="125" rx="36" ry="16" fill="#991b1b" stroke="#7f1d1d" stroke-width="2"/>
            <path d="M 225 125 Q 255 105 285 125 Q 255 138 225 125 Z" fill="#b91c1c"/>
            <!-- Fluted Steel Dome Helmet Rising from Turban -->
            <path d="M 232 120 Q 255 55 255 50 Q 255 55 278 120 Z" fill="url(#helmetGrad)" stroke="#cbd5e1" stroke-width="2"/>
            <!-- Gold damascening grooves on helmet -->
            <line x1="255" y1="50" x2="245" y2="120" stroke="#f59e0b" stroke-width="1.5"/>
            <line x1="255" y1="50" x2="255" y2="120" stroke="#f59e0b" stroke-width="1.5"/>
            <line x1="255" y1="50" x2="265" y2="120" stroke="#f59e0b" stroke-width="1.5"/>
            <circle cx="255" cy="48" r="4" fill="url(#goldGrad)"/>
        """
    },
    "hafif_suvari": {
        "name": "Hafif Süvari",
        "title": "Hızlı Akın Süvarisi",
        "bg_top": "#121b18",
        "bg_bot": "#060d0a",
        "glow": "#10b981",
        "pedestal": "#132a22",
        "details": """
            <!-- 3D Pedestal & Horse Shadow -->
            <ellipse cx="256" cy="455" rx="170" ry="38" fill="url(#pedestalGlow)" filter="blur(10px)" opacity="0.6"/>
            <ellipse cx="256" cy="450" rx="160" ry="32" fill="#1c1917" stroke="#065f46" stroke-width="3"/>
            <ellipse cx="256" cy="445" rx="145" ry="26" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
            <ellipse cx="256" cy="438" rx="120" ry="22" fill="#000000" opacity="0.75" filter="blur(5px)"/>

            <!-- 3D Anatolian Warhorse (Bay / Kestane Renkli Savaş Atı) -->
            <!-- Horse Rear & Legs -->
            <path d="M 120 380 Q 110 435 140 435 Q 155 410 160 380 Z" fill="#5c2c16" stroke="#36170a" stroke-width="2"/>
            <path d="M 160 370 Q 165 425 185 435 Q 195 410 190 370 Z" fill="#783a1b" stroke="#36170a" stroke-width="2"/>
            <!-- Horse Hooves with Iron Shoes -->
            <rect x="125" y="428" width="22" height="9" rx="3" fill="#1c1917"/>
            <rect x="175" y="428" width="20" height="9" rx="3" fill="#1c1917"/>

            <!-- Horse Front Legs -->
            <path d="M 330 360 Q 345 425 365 435 Q 375 410 360 360 Z" fill="#783a1b" stroke="#36170a" stroke-width="2"/>
            <path d="M 365 355 Q 390 420 405 430 Q 415 405 390 350 Z" fill="#5c2c16" stroke="#36170a" stroke-width="2"/>
            <rect x="350" y="428" width="20" height="9" rx="3" fill="#1c1917"/>
            <rect x="395" y="425" width="20" height="9" rx="3" fill="#1c1917"/>

            <!-- Horse Muscular Body & Flanks -->
            <ellipse cx="250" cy="345" rx="125" ry="55" fill="url(#horseCoat)" stroke="#36170a" stroke-width="3"/>
            <!-- Horse Flowing Mane & Tail -->
            <path d="M 115 325 Q 75 375 95 440 Q 110 400 125 350 Z" fill="#1c1917"/> <!-- Black horse tail -->

            <!-- Horse Strong Neck & Head -->
            <path d="M 340 320 Q 380 240 405 210 Q 425 240 400 280 Q 365 325 340 330 Z" fill="#783a1b" stroke="#36170a" stroke-width="2.5"/>
            <!-- Horse Head -->
            <path d="M 405 210 Q 435 215 445 245 Q 430 265 395 255 Z" fill="#6a3317" stroke="#36170a" stroke-width="2"/>
            <!-- Horse Ears, Eyes & Bridle -->
            <path d="M 405 205 L 412 185 L 420 205 Z" fill="#5c2c16"/>
            <circle cx="418" cy="225" r="4" fill="#0f172a"/>
            <!-- Leather Bridle with Brass Studs -->
            <line x1="410" y1="212" x2="438" y2="252" stroke="#d97706" stroke-width="3"/>
            <line x1="438" y1="252" x2="400" y2="255" stroke="#d97706" stroke-width="3"/>
            <circle cx="438" cy="252" r="4" fill="#fef08a"/>

            <!-- Saddle & Embellished Shabrack (At Çulu) -->
            <path d="M 195 305 Q 250 325 305 305 L 315 345 Q 250 365 185 345 Z" fill="#047857" stroke="#065f46" stroke-width="2.5"/>
            <!-- Gold tassels on saddle blanket -->
            <path d="M 190 345 L 310 345" stroke="#fbbf24" stroke-width="4" stroke-dasharray="6 4"/>
            <!-- High Ottoman Wood & Leather Saddle Cantle -->
            <path d="M 210 290 Q 220 260 235 295 M 275 295 Q 290 260 300 290" stroke="#78350f" stroke-width="6"/>

            <!-- Mounted Cavalryman (Süvari) -->
            <!-- Stirrup Leather & Iron Stirrup with Boot -->
            <line x1="255" y1="300" x2="250" y2="385" stroke="#451a03" stroke-width="4"/>
            <path d="M 235 375 L 265 375 L 270 395 L 230 395 Z" fill="#1c1917" stroke="#94a3b8" stroke-width="2"/>

            <!-- Torso & Leather Lamellar Cuirass -->
            <path d="M 220 210 Q 255 200 290 210 L 285 295 Q 255 300 225 295 Z" fill="#065f46" stroke="#064e3b" stroke-width="2"/>
            <path d="M 230 220 L 280 220 M 228 240 L 282 240 M 230 260 L 280 260" stroke="#b45309" stroke-width="3"/>

            <!-- Long Lance with Pennon (Süvari Kargısı) -->
            <line x1="170" y1="410" x2="350" y2="30" stroke="#78350f" stroke-width="6"/>
            <!-- Steel Spearhead -->
            <polygon points="350,30 362,55 350,70 338,55" fill="url(#steelGrad)" stroke="#f8fafc" stroke-width="1.5"/>
            <!-- Green & Gold Cavalry Fluttering Pennant -->
            <path d="M 350 70 Q 310 85 260 65 Q 290 95 250 115 Q 310 95 350 85 Z" fill="#10b981" stroke="#047857" stroke-width="1.5"/>

            <!-- Rider Head & Fur-Trimmed Börk Cap -->
            <circle cx="255" cy="155" r="18" fill="#e09f67"/>
            <!-- Mustache & Eyes -->
            <path d="M 245 160 Q 255 168 265 160" stroke="#1c1917" stroke-width="3" stroke-linecap="round"/>
            <circle cx="248" cy="152" r="2" fill="#1c1917"/>
            <circle cx="262" cy="152" r="2" fill="#1c1917"/>
            <!-- Conical Leather Fur Hat (Börk) with Horsehair Plume -->
            <path d="M 235 150 Q 255 90 265 85 Q 265 110 275 150 Z" fill="#92400e" stroke="#451a03" stroke-width="2"/>
            <ellipse cx="255" cy="150" rx="23" ry="8" fill="#451a03"/>
            <path d="M 265 85 Q 290 95 285 130" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
        """
    },
    "casus": {
        "name": "Casus",
        "title": "Gölge İstihbarat Subayı",
        "bg_top": "#12141c",
        "bg_bot": "#06070a",
        "glow": "#8b5cf6",
        "pedestal": "#1e1b4b",
        "details": """
            <!-- 3D Pedestal & Shadow -->
            <ellipse cx="256" cy="455" rx="170" ry="38" fill="url(#pedestalGlow)" filter="blur(10px)" opacity="0.6"/>
            <ellipse cx="256" cy="450" rx="160" ry="32" fill="#0f172a" stroke="#4c1d95" stroke-width="3"/>
            <ellipse cx="256" cy="445" rx="145" ry="26" fill="#18181b" stroke="#7c3aed" stroke-width="1.5"/>
            <ellipse cx="256" cy="438" rx="80" ry="18" fill="#000000" opacity="0.85" filter="blur(5px)"/>

            <!-- Stealth Crouching / Recon Stance -->
            <!-- Soft Leather Stalker Boots -->
            <path d="M 210 385 L 200 435 L 235 435 L 240 390 Z" fill="#18181b" stroke="#27272a" stroke-width="2"/>
            <path d="M 275 385 L 280 435 L 315 435 L 305 390 Z" fill="#18181b" stroke="#27272a" stroke-width="2"/>

            <!-- Flowing Night Cloak (Pelerin) -->
            <path d="M 180 200 Q 140 320 160 425 Q 255 445 355 425 Q 375 320 330 200 Z" fill="#09090b" stroke="#18181b" stroke-width="3"/>
            <path d="M 195 220 Q 170 330 185 410 Q 255 425 325 410 Q 345 330 320 220 Z" fill="#18181b" opacity="0.7"/>

            <!-- Hidden Leather Utility Harness with Map Scrolls & Throwing Knives -->
            <line x1="220" y1="210" x2="285" y2="300" stroke="#78350f" stroke-width="6"/>
            <line x1="285" y1="210" x2="220" y2="300" stroke="#78350f" stroke-width="6"/>
            <!-- Leather Parchment Map Case Tube -->
            <rect x="270" y="270" width="16" height="55" rx="4" fill="#b45309" stroke="#78350f" stroke-width="2" transform="rotate(25 278 297)"/>
            <!-- Concealed Throwing Knives -->
            <line x1="235" y1="240" x2="245" y2="260" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
            <line x1="245" y1="245" x2="255" y2="265" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>

            <!-- Left Hand Holding Brass Optical Telescope / Spyglass (Dürbün) -->
            <path d="M 215 230 Q 185 240 175 220" stroke="#18181b" stroke-width="16" stroke-linecap="round"/>
            <path d="M 175 220 L 140 205" stroke="url(#goldGrad)" stroke-width="12" stroke-linecap="round"/>
            <circle cx="138" cy="204" r="7" fill="#67e8f9" stroke="#0891b2" stroke-width="2"/> <!-- Glowing optical lens -->

            <!-- Right Hand with Poisoned Curved Stiletto Dagger -->
            <path d="M 295 230 Q 330 250 335 275" stroke="#18181b" stroke-width="16" stroke-linecap="round"/>
            <circle cx="335" cy="275" r="10" fill="#27272a"/>
            <path d="M 335 275 Q 365 295 385 285" stroke="url(#steelGrad)" stroke-width="5" stroke-linecap="round"/>

            <!-- Deep Shadow Hood & Mask (Yüz Peçesi) -->
            <path d="M 215 190 Q 255 100 295 190 Q 305 220 290 230 Q 255 240 220 230 Z" fill="#09090b" stroke="#3b0764" stroke-width="2"/>
            <!-- Dark Hood Interior Shadow -->
            <path d="M 225 185 Q 255 130 285 185 Q 280 215 255 218 Q 230 215 225 185 Z" fill="#000000"/>
            <!-- Face Mask / Veil -->
            <rect x="235" y="175" width="40" height="22" rx="4" fill="#2e1065"/>
            <!-- Glowing Piercing Spy Eyes in the Dark -->
            <ellipse cx="245" cy="165" rx="5" ry="3" fill="#a855f7" filter="blur(1px)"/>
            <ellipse cx="265" cy="165" rx="5" ry="3" fill="#a855f7" filter="blur(1px)"/>
            <circle cx="245" cy="165" r="1.5" fill="#ffffff"/>
            <circle cx="265" cy="165" r="1.5" fill="#ffffff"/>
        """
    },
    "kocbasi": {
        "name": "Koçbaşı",
        "title": "Ağır Muhasara Koçbaşı",
        "bg_top": "#1c1917",
        "bg_bot": "#0a0a0a",
        "glow": "#f59e0b",
        "pedestal": "#44403c",
        "details": """
            <!-- 3D Pedestal Platform -->
            <ellipse cx="256" cy="455" rx="190" ry="42" fill="url(#pedestalGlow)" filter="blur(10px)" opacity="0.6"/>
            <ellipse cx="256" cy="450" rx="180" ry="35" fill="#1c1917" stroke="#78350f" stroke-width="4"/>
            <ellipse cx="256" cy="445" rx="160" ry="28" fill="#292524" stroke="#d97706" stroke-width="2"/>
            <ellipse cx="256" cy="440" rx="140" ry="22" fill="#000000" opacity="0.85" filter="blur(6px)"/>

            <!-- Heavy Timber Siege Ram Framework (Ahşap Çatı & Tekerlekler) -->
            <!-- Four Massive Spiked Iron-Banded Wheels -->
            <!-- Left Rear Wheel -->
            <ellipse cx="140" cy="410" rx="28" ry="40" fill="#291811" stroke="#78350f" stroke-width="6"/>
            <circle cx="140" cy="410" r="12" fill="url(#steelGrad)" stroke="#1c1917" stroke-width="2"/>
            <!-- Left Front Wheel -->
            <ellipse cx="205" cy="425" rx="30" ry="42" fill="#451a03" stroke="#92400e" stroke-width="6"/>
            <circle cx="205" cy="425" r="14" fill="url(#steelGrad)" stroke="#1c1917" stroke-width="2"/>
            <!-- Spikes on wheel -->
            <line x1="205" y1="380" x2="205" y2="470" stroke="#cbd5e1" stroke-width="3"/>
            <line x1="175" y1="425" x2="235" y2="425" stroke="#cbd5e1" stroke-width="3"/>

            <!-- Right Rear Wheel -->
            <ellipse cx="320" cy="410" rx="28" ry="40" fill="#291811" stroke="#78350f" stroke-width="6"/>
            <circle cx="320" cy="410" r="12" fill="url(#steelGrad)" stroke="#1c1917" stroke-width="2"/>
            <!-- Right Front Wheel -->
            <ellipse cx="380" cy="425" rx="30" ry="42" fill="#451a03" stroke="#92400e" stroke-width="6"/>
            <circle cx="380" cy="425" r="14" fill="url(#steelGrad)" stroke="#1c1917" stroke-width="2"/>
            <line x1="380" y1="380" x2="380" y2="470" stroke="#cbd5e1" stroke-width="3"/>
            <line x1="350" y1="425" x2="410" y2="425" stroke="#cbd5e1" stroke-width="3"/>

            <!-- Heavy Oak Chassis Beams -->
            <rect x="140" y="385" width="240" height="28" rx="4" fill="#5c2b12" stroke="#291107" stroke-width="3"/>
            <!-- Iron corner brackets and bolts -->
            <circle cx="155" cy="399" r="4" fill="url(#steelGrad)"/>
            <circle cx="255" cy="399" r="4" fill="url(#steelGrad)"/>
            <circle cx="365" cy="399" r="4" fill="url(#steelGrad)"/>

            <!-- A-Frame Vertical Support Beams -->
            <line x1="170" y1="385" x2="256" y2="180" stroke="#78350f" stroke-width="14" stroke-linecap="round"/>
            <line x1="340" y1="385" x2="256" y2="180" stroke="#78350f" stroke-width="14" stroke-linecap="round"/>
            <line x1="210" y1="385" x2="256" y2="180" stroke="#92400e" stroke-width="8"/>
            <line x1="300" y1="385" x2="256" y2="180" stroke="#92400e" stroke-width="8"/>

            <!-- Heavy Rawhide Covered Pitched Protective Roof (Kaplumbağa Sundurma) -->
            <polygon points="256,120 120,200 135,215 256,145 375,215 390,200" fill="#78350f" stroke="#451a03" stroke-width="3"/>
            <polygon points="256,145 135,215 150,290 256,220 360,290 375,215" fill="#451a03" stroke="#260e03" stroke-width="2.5"/>
            <!-- Iron Strapping across roof -->
            <line x1="190" y1="175" x2="200" y2="250" stroke="#64748b" stroke-width="5"/>
            <line x1="320" y1="175" x2="310" y2="250" stroke="#64748b" stroke-width="5"/>

            <!-- Suspension Iron Chains (Zincirler) -->
            <line x1="230" y1="190" x2="220" y2="290" stroke="#94a3b8" stroke-width="4" stroke-dasharray="6 3"/>
            <line x1="280" y1="190" x2="290" y2="290" stroke="#94a3b8" stroke-width="4" stroke-dasharray="6 3"/>

            <!-- THE MASSIVE BATTERING RAM LOG & FORGED IRON RAM HEAD -->
            <!-- Huge Tree Trunk Log -->
            <rect x="130" y="275" width="250" height="42" rx="16" fill="url(#woodLogGrad)" stroke="#260f02" stroke-width="4"/>
            <!-- Steel Bands around the log -->
            <rect x="180" y="273" width="12" height="46" rx="2" fill="url(#steelGrad)" stroke="#1e293b" stroke-width="1.5"/>
            <rect x="250" y="273" width="12" height="46" rx="2" fill="url(#steelGrad)" stroke="#1e293b" stroke-width="1.5"/>
            <rect x="320" y="273" width="12" height="46" rx="2" fill="url(#steelGrad)" stroke="#1e293b" stroke-width="1.5"/>

            <!-- Sculpted Solid Cast-Iron Ram's Head (Dövme Demir Koç Başı) -->
            <path d="M 370 260 Q 425 240 455 285 Q 465 305 445 325 Q 410 340 370 330 Z" fill="url(#ironHeadGrad)" stroke="#e2e8f0" stroke-width="3"/>
            <!-- Curved Ferocious Horns on Ram Head -->
            <path d="M 425 260 Q 460 210 420 185 Q 390 200 410 240" fill="none" stroke="url(#goldGrad)" stroke-width="14" stroke-linecap="round"/>
            <path d="M 405 270 Q 440 220 405 195" fill="none" stroke="#fef08a" stroke-width="4" stroke-linecap="round"/>
            <!-- Ram Snout & Battering Impact Boss -->
            <circle cx="452" cy="295" r="16" fill="url(#steelSphere)" stroke="#f8fafc" stroke-width="3"/>
            <circle cx="448" cy="291" r="5" fill="#ffffff" opacity="0.8"/>
        """
    },
    "akinci": {
        "name": "Osmanoğulları Akıncısı",
        "title": "Balkan Fatihi Hafif Atlı",
        "bg_top": "#2a150c",
        "bg_bot": "#0a0503",
        "glow": "#f97316",
        "pedestal": "#431407",
        "details": """
            <!-- 3D Pedestal & Shadow -->
            <ellipse cx="256" cy="455" rx="170" ry="38" fill="url(#pedestalGlow)" filter="blur(10px)" opacity="0.6"/>
            <ellipse cx="256" cy="450" rx="160" ry="32" fill="#1c1917" stroke="#c2410c" stroke-width="3"/>
            <ellipse cx="256" cy="445" rx="145" ry="26" fill="#292524" stroke="#f97316" stroke-width="1.5"/>
            <ellipse cx="256" cy="438" rx="90" ry="20" fill="#000000" opacity="0.85" filter="blur(5px)"/>

            <!-- Legendary Ottoman Akinji Raider Hero Stance -->
            <!-- Leather High Stirrup Riding Boots with Silver Spurs -->
            <path d="M 210 365 L 200 432 L 235 435 L 242 370 Z" fill="#291811" stroke="#451a03" stroke-width="2"/>
            <path d="M 275 365 L 280 432 L 315 435 L 308 370 Z" fill="#291811" stroke="#451a03" stroke-width="2"/>
            <circle cx="198" cy="425" r="4" fill="url(#steelGrad)"/>
            <circle cx="317" cy="425" r="4" fill="url(#steelGrad)"/>

            <!-- Crimson Kaftan & Wolf-Pelt Cape (Kurt Postu) -->
            <path d="M 180 200 Q 150 320 170 410 Q 255 430 340 410 Q 360 320 330 200 Z" fill="#991b1b" stroke="#7f1d1d" stroke-width="2.5"/>
            <!-- Leopard / Wolf Pelt Over Shoulders with Claws -->
            <path d="M 180 190 Q 255 170 330 190 L 340 250 Q 255 270 170 250 Z" fill="#d97706" stroke="#78350f" stroke-width="2"/>
            <!-- Spotted fur pattern -->
            <circle cx="210" cy="210" r="3" fill="#451a03"/>
            <circle cx="240" cy="220" r="4" fill="#451a03"/>
            <circle cx="270" cy="215" r="3" fill="#451a03"/>
            <circle cx="300" cy="210" r="4" fill="#451a03"/>

            <!-- Leather Brigandine Vest with Gold Rivets -->
            <path d="M 205 210 Q 255 195 305 210 L 300 300 Q 255 310 210 300 Z" fill="#451a03" stroke="#270e02" stroke-width="2"/>
            <!-- Gold studs -->
            <circle cx="230" cy="235" r="3" fill="url(#goldGrad)"/>
            <circle cx="255" cy="235" r="3" fill="url(#goldGrad)"/>
            <circle cx="280" cy="235" r="3" fill="url(#goldGrad)"/>
            <circle cx="230" cy="265" r="3" fill="url(#goldGrad)"/>
            <circle cx="255" cy="265" r="3" fill="url(#goldGrad)"/>
            <circle cx="280" cy="265" r="3" fill="url(#goldGrad)"/>

            <!-- Composite Recurve Turkish Bow (Türk Yayı) in Hand -->
            <path d="M 150 140 Q 110 240 150 340" stroke="#78350f" stroke-width="7" stroke-linecap="round"/>
            <path d="M 150 140 Q 110 240 150 340" stroke="url(#goldGrad)" stroke-width="2" stroke-linecap="round"/>
            <!-- Bowstring drawn tight -->
            <line x1="150" y1="140" x2="150" y2="340" stroke="#f8fafc" stroke-width="1.5"/>

            <!-- Leather Quiver (Sadak) Filled with Eagle Feather Arrows -->
            <rect x="300" y="230" width="22" height="70" rx="5" fill="#78350f" stroke="#451a03" stroke-width="2" transform="rotate(18 311 265)"/>
            <line x1="315" y1="210" x2="322" y2="240" stroke="#e2e8f0" stroke-width="3"/>
            <line x1="325" y1="205" x2="332" y2="235" stroke="#e2e8f0" stroke-width="3"/>
            <!-- Eagle feathers fletching -->
            <polygon points="312,205 318,190 324,208" fill="#f8fafc" stroke="#475569" stroke-width="1"/>
            <polygon points="322,200 328,185 334,203" fill="#f8fafc" stroke="#475569" stroke-width="1"/>

            <!-- Right Hand with Curved Scimitar / Yalman Kılıç -->
            <path d="M 290 220 Q 340 230 355 260" stroke="#991b1b" stroke-width="18" stroke-linecap="round"/>
            <!-- Steel Blade pointing downward -->
            <path d="M 355 260 Q 385 330 375 390 Q 365 370 350 300 Z" fill="url(#swordSteel)" stroke="#f8fafc" stroke-width="2"/>

            <!-- Head & Winged Falcon-Feathered Börk Helmet -->
            <ellipse cx="255" cy="140" rx="20" ry="24" fill="#e09f67"/>
            <!-- Braided warrior mustache -->
            <path d="M 240 145 Q 255 158 270 145" stroke="#1c1917" stroke-width="3.5" stroke-linecap="round"/>
            <!-- Steppe Nomad Eyes -->
            <circle cx="245" cy="138" r="2.5" fill="#1c1917"/>
            <circle cx="265" cy="138" r="2.5" fill="#1c1917"/>

            <!-- Akinji High Fur Börk with Eagle Wings / Feather Crown -->
            <path d="M 230 135 Q 255 60 265 50 Q 275 80 280 135 Z" fill="#78350f" stroke="#451a03" stroke-width="2"/>
            <ellipse cx="255" cy="135" rx="26" ry="10" fill="#291811"/>
            <!-- Pure White Crane / Falcon Feathers on Crest (Turna Teli) -->
            <path d="M 255 50 Q 230 20 215 35 Q 240 45 255 52" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
            <path d="M 255 50 Q 280 20 295 35 Q 270 45 255 52" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
        """
    },
    "gulam": {
        "name": "Karaman Gulam Muhafızı",
        "title": "Ağır Zırhlı Payitaht Muhafızı",
        "bg_top": "#141d24",
        "bg_bot": "#060a0e",
        "glow": "#0284c7",
        "pedestal": "#0c4a6e",
        "details": """
            <!-- 3D Pedestal & Shadow -->
            <ellipse cx="256" cy="455" rx="170" ry="38" fill="url(#pedestalGlow)" filter="blur(10px)" opacity="0.6"/>
            <ellipse cx="256" cy="450" rx="160" ry="32" fill="#0f172a" stroke="#0284c7" stroke-width="3"/>
            <ellipse cx="256" cy="445" rx="145" ry="26" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
            <ellipse cx="256" cy="438" rx="85" ry="18" fill="#000000" opacity="0.8" filter="blur(5px)"/>

            <!-- Heavy Segmented Plate & Chain Armor (Zırhlı Sipahi/Gulam) -->
            <!-- Articulated Steel Sabatons / Greaves -->
            <path d="M 210 365 L 200 432 L 240 435 L 245 370 Z" fill="url(#steelGrad)" stroke="#64748b" stroke-width="2"/>
            <path d="M 270 365 L 275 432 L 315 435 L 305 370 Z" fill="url(#steelGrad)" stroke="#64748b" stroke-width="2"/>
            <circle cx="225" cy="380" r="8" fill="url(#goldGrad)"/>
            <circle cx="290" cy="380" r="8" fill="url(#goldGrad)"/>

            <!-- Royal Blue Silk & Chainmail Skirt -->
            <path d="M 195 295 L 185 375 L 325 375 L 315 295 Z" fill="#0369a1" stroke="#075985" stroke-width="2.5"/>
            <path d="M 205 305 L 198 360 L 312 360 L 305 305 Z" fill="url(#chainmailPattern)" stroke="#475569" stroke-width="2"/>

            <!-- Ornate Gold-Inlaid Ottoman Krug / Mirror Torso Armor -->
            <path d="M 195 190 Q 255 175 315 190 L 315 295 Q 255 305 195 295 Z" fill="url(#steelGrad)" stroke="#334155" stroke-width="3"/>
            <!-- Karamanid Hexagram / Star of Solomon on Central Breastplate -->
            <circle cx="255" cy="245" r="42" fill="url(#goldGrad)" stroke="#fef08a" stroke-width="2"/>
            <circle cx="255" cy="245" r="32" fill="#0369a1" stroke="#38bdf8" stroke-width="2"/>
            <!-- 6-Pointed Star (Mühr-ü Süleyman) -->
            <polygon points="255,220 270,260 230,235 280,235 240,260" fill="none" stroke="#fef08a" stroke-width="3"/>

            <!-- Massive Iron Flanged War Mace (Gürz / Bozdoğan) in Right Hand -->
            <path d="M 305 200 Q 360 210 380 250" stroke="#0284c7" stroke-width="20" stroke-linecap="round"/>
            <line x1="380" y1="250" x2="420" y2="100" stroke="#78350f" stroke-width="10" stroke-linecap="round"/>
            <!-- Solid Iron Flanged Mace Head -->
            <circle cx="420" cy="100" r="24" fill="url(#steelSphere)" stroke="#f8fafc" stroke-width="3"/>
            <polygon points="420,70 435,95 420,110 405,95" fill="url(#goldGrad)"/>
            <polygon points="445,100 420,115 420,85" fill="url(#goldGrad)"/>

            <!-- Left Arm with Heavy Steel Buckler Shield -->
            <ellipse cx="175" cy="240" rx="48" ry="52" fill="url(#steelGrad)" stroke="#f8fafc" stroke-width="3"/>
            <circle cx="175" cy="240" r="22" fill="url(#goldGrad)" stroke="#fef08a" stroke-width="2"/>
            <circle cx="171" cy="236" r="6" fill="#ffffff" opacity="0.8"/>

            <!-- Segmented Spaulders / Shoulder Guards -->
            <ellipse cx="190" cy="195" rx="20" ry="15" fill="url(#steelGrad)" stroke="#94a3b8" stroke-width="2"/>
            <ellipse cx="320" cy="195" rx="20" ry="15" fill="url(#steelGrad)" stroke="#94a3b8" stroke-width="2"/>

            <!-- Heavy Ottoman Miğfer Helmet with Steel Aventail & Nasal Bar -->
            <path d="M 230 145 Q 255 170 280 145 L 290 200 Q 255 210 220 200 Z" fill="url(#chainmailPattern)" stroke="#475569" stroke-width="2"/>
            <!-- Severe Visage -->
            <ellipse cx="255" cy="140" rx="20" ry="22" fill="#e09f67"/>
            <path d="M 240 145 Q 255 155 270 145" stroke="#1c1917" stroke-width="3" stroke-linecap="round"/>
            <circle cx="246" cy="136" r="2.5" fill="#1c1917"/>
            <circle cx="264" cy="136" r="2.5" fill="#1c1917"/>

            <!-- Conical Chiseled Steel Helmet -->
            <path d="M 226 135 Q 255 60 255 55 Q 255 60 284 135 Z" fill="url(#steelGrad)" stroke="#e2e8f0" stroke-width="2.5"/>
            <line x1="255" y1="125" x2="255" y2="155" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round"/>
            <!-- Gold Crest Plume -->
            <circle cx="255" cy="53" r="5" fill="url(#goldGrad)"/>
            <path d="M 255 53 Q 235 25 210 40 Q 240 45 255 53" fill="#38bdf8"/>
        """
    },
    "levent": {
        "name": "Aydınoğlu Leventi",
        "title": "Ege Gazisi Deniz Savaşçısı",
        "bg_top": "#0f2324",
        "bg_bot": "#050d0e",
        "glow": "#06b6d4",
        "pedestal": "#164e63",
        "details": """
            <!-- 3D Pedestal (Weathered Galley Planking & Stone) -->
            <ellipse cx="256" cy="455" rx="170" ry="38" fill="url(#pedestalGlow)" filter="blur(10px)" opacity="0.6"/>
            <ellipse cx="256" cy="450" rx="160" ry="32" fill="#1c1917" stroke="#0891b2" stroke-width="3"/>
            <ellipse cx="256" cy="445" rx="145" ry="26" fill="#164e63" stroke="#22d3ee" stroke-width="1.5"/>
            <ellipse cx="256" cy="438" rx="80" ry="18" fill="#000000" opacity="0.8" filter="blur(5px)"/>

            <!-- Athletic Corsair / Marine Boarding Stance -->
            <!-- Barefoot or Light Leather Deck Slippers (Çarık) -->
            <path d="M 205 385 L 195 435 L 235 435 L 240 390 Z" fill="#78350f" stroke="#451a03" stroke-width="2"/>
            <path d="M 275 385 L 280 435 L 320 435 L 310 390 Z" fill="#78350f" stroke="#451a03" stroke-width="2"/>

            <!-- Baggy Turkish Salwar Trousers (Şalvar) -->
            <path d="M 195 300 Q 170 360 215 390 L 255 350 L 295 390 Q 340 360 315 300 Z" fill="#0e7490" stroke="#155e75" stroke-width="2.5"/>

            <!-- Crimson Silk Sash (İpek Kuşak) with Yatagan & Boarding Axe -->
            <rect x="195" y="280" width="120" height="24" rx="4" fill="#be123c" stroke="#9f1239" stroke-width="2"/>
            <!-- Inlaid Ottoman Yatagan Dagger Tucked in Sash -->
            <path d="M 220 285 Q 240 250 260 280" stroke="#f8fafc" stroke-width="8" stroke-linecap="round"/>
            <path d="M 220 285 Q 200 330 180 345" stroke="#78350f" stroke-width="7" stroke-linecap="round"/>

            <!-- Torso: Leather Vest over Linen Sailor Shirt -->
            <path d="M 205 190 L 305 190 L 310 285 L 200 285 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
            <path d="M 200 190 L 240 285 L 200 285 Z" fill="#78350f"/>
            <path d="M 310 190 L 270 285 L 310 285 Z" fill="#78350f"/>

            <!-- Dual Scimitars / Boarding Sabers in Hands -->
            <!-- Left Hand Saber -->
            <path d="M 205 200 Q 160 220 140 250" stroke="#0e7490" stroke-width="16" stroke-linecap="round"/>
            <path d="M 140 250 Q 100 220 80 150 Q 100 170 140 240 Z" fill="url(#swordSteel)" stroke="#f8fafc" stroke-width="2"/>
            <!-- Right Hand Boarding Saber Raised High -->
            <path d="M 305 200 Q 360 180 380 140" stroke="#0e7490" stroke-width="16" stroke-linecap="round"/>
            <path d="M 380 140 Q 420 80 435 30 Q 410 65 375 130 Z" fill="url(#swordSteel)" stroke="#f8fafc" stroke-width="2"/>

            <!-- Corsair Turban & Leather Eyepatch / Sun-bronzed Warrior -->
            <ellipse cx="255" cy="140" rx="22" ry="24" fill="#b45309"/>
            <!-- Black Beard & Smirking Sailor Mustache -->
            <path d="M 240 145 Q 255 160 270 145" stroke="#1c1917" stroke-width="3" stroke-linecap="round"/>
            <circle cx="245" cy="135" r="2.5" fill="#1c1917"/>
            <!-- Badass Eyepatch over right eye -->
            <line x1="230" y1="125" x2="280" y2="145" stroke="#1c1917" stroke-width="3"/>
            <circle cx="265" cy="138" r="5" fill="#1c1917"/>

            <!-- Teal & White Corsair Turban Wrapped around Felt Cap -->
            <ellipse cx="255" cy="120" rx="34" ry="16" fill="#06b6d4" stroke="#0891b2" stroke-width="2"/>
            <path d="M 225 120 Q 255 100 285 120 Q 255 135 225 120 Z" fill="#ffffff"/>
            <!-- Golden crescent brooch on turban -->
            <path d="M 255 110 A 6 6 0 1 0 255 122 A 4 4 0 1 1 255 110" fill="url(#goldGrad)"/>
        """
    },
    "kure_baltacisi": {
        "name": "Candaroğlu Küre Baltacısı",
        "title": "Küre Bakır Madeni Ağır Tebercisi",
        "bg_top": "#26150f",
        "bg_bot": "#0c0604",
        "glow": "#ea580c",
        "pedestal": "#7c2d12",
        "details": """
            <!-- 3D Pedestal & Shadow -->
            <ellipse cx="256" cy="455" rx="170" ry="38" fill="url(#pedestalGlow)" filter="blur(10px)" opacity="0.6"/>
            <ellipse cx="256" cy="450" rx="160" ry="32" fill="#1c1917" stroke="#c2410c" stroke-width="3"/>
            <ellipse cx="256" cy="445" rx="145" ry="26" fill="#292524" stroke="#ea580c" stroke-width="1.5"/>
            <ellipse cx="256" cy="438" rx="90" ry="20" fill="#000000" opacity="0.85" filter="blur(5px)"/>

            <!-- Massive Heavy Miner Brute Stance -->
            <!-- Heavy Spiked Iron-Toed Boots -->
            <path d="M 200 365 L 190 435 L 235 435 L 240 370 Z" fill="#291811" stroke="#451a03" stroke-width="2.5"/>
            <path d="M 275 365 L 280 435 L 325 435 L 315 370 Z" fill="#291811" stroke="#451a03" stroke-width="2.5"/>
            <!-- Copper/Iron Toe Caps -->
            <rect x="190" y="425" width="22" height="10" rx="3" fill="#b45309"/>
            <rect x="303" y="425" width="22" height="10" rx="3" fill="#b45309"/>

            <!-- Heavy Leather Miner Apron & Padded Gambeson -->
            <path d="M 190 280 L 180 380 L 330 380 L 320 280 Z" fill="#78350f" stroke="#451a03" stroke-width="3"/>
            <path d="M 205 290 L 195 365 L 315 365 L 305 290 Z" fill="#451a03"/>

            <!-- Torso: Copper-Studded Heavy Ox-Hide Armor -->
            <path d="M 190 190 Q 255 175 320 190 L 315 285 Q 255 295 195 285 Z" fill="#291811" stroke="#1c1917" stroke-width="3"/>
            <!-- Raw Copper Ore Chest Plates -->
            <rect x="210" y="210" width="40" height="35" rx="4" fill="url(#copperGrad)" stroke="#7c2d12" stroke-width="2"/>
            <rect x="260" y="210" width="40" height="35" rx="4" fill="url(#copperGrad)" stroke="#7c2d12" stroke-width="2"/>

            <!-- TWO-HANDED COLOSSAL DOUBLE-BEARDED BATTLEAXE (TEBER / BALTA) -->
            <!-- Reinforced Ash Shaft -->
            <line x1="160" y1="450" x2="390" y2="40" stroke="#78350f" stroke-width="12" stroke-linecap="round"/>
            <!-- Iron Wire Whipping along shaft -->
            <line x1="280" y1="230" x2="300" y2="200" stroke="#94a3b8" stroke-width="4"/>
            <!-- Massive Double Axe Head with Copper Inlay & Razor Edge -->
            <path d="M 390 40 L 360 85 L 320 30 Q 355 50 370 70 Z" fill="url(#steelGrad)" stroke="#f8fafc" stroke-width="2"/>
            <path d="M 390 40 L 440 30 Q 420 70 410 90 L 375 80 Z" fill="url(#steelGrad)" stroke="#f8fafc" stroke-width="2"/>
            <!-- Center Axe Eye & Spike -->
            <circle cx="375" cy="65" r="14" fill="url(#copperGrad)" stroke="#431407" stroke-width="2"/>
            <polygon points="390,40 405,15 385,25" fill="#f8fafc"/>

            <!-- Heavy Arms with Spiked Bicep Bands -->
            <path d="M 195 195 Q 220 260 250 290" stroke="#78350f" stroke-width="22" stroke-linecap="round"/>
            <path d="M 315 195 Q 310 240 330 200" stroke="#78350f" stroke-width="22" stroke-linecap="round"/>

            <!-- Rugged Face & Heavy Mining Helmet with Iron Horns / Visor -->
            <ellipse cx="255" cy="140" rx="24" ry="26" fill="#d97706"/>
            <!-- Massive Bushy Black/Copper Beard -->
            <path d="M 230 140 Q 255 195 280 140 Q 275 190 235 190 Z" fill="#291811"/>
            <circle cx="245" cy="135" r="2.5" fill="#1c1917"/>
            <circle cx="265" cy="135" r="2.5" fill="#1c1917"/>

            <!-- Heavy Riveted Miner Helmet (Küre Miğferi) with Brow Plate -->
            <path d="M 225 130 Q 255 65 285 130 Z" fill="url(#copperGrad)" stroke="#431407" stroke-width="3"/>
            <rect x="223" y="125" width="64" height="12" rx="3" fill="url(#steelGrad)" stroke="#1e293b" stroke-width="2"/>
            <circle cx="230" cy="131" r="2" fill="#ffffff"/>
            <circle cx="255" cy="131" r="2" fill="#ffffff"/>
            <circle cx="280" cy="131" r="2" fill="#ffffff"/>
        """
    },
    "bozok_suvarisi": {
        "name": "Dulkadiroğlu Bozok Süvarisi",
        "title": "Bozkır Kartalı Atlı Okçusu",
        "bg_top": "#1a1c12",
        "bg_bot": "#090a06",
        "glow": "#84cc16",
        "pedestal": "#365314",
        "details": """
            <!-- 3D Pedestal & Shadow -->
            <ellipse cx="256" cy="455" rx="170" ry="38" fill="url(#pedestalGlow)" filter="blur(10px)" opacity="0.6"/>
            <ellipse cx="256" cy="450" rx="160" ry="32" fill="#1c1917" stroke="#4d7c0f" stroke-width="3"/>
            <ellipse cx="256" cy="445" rx="145" ry="26" fill="#1e293b" stroke="#84cc16" stroke-width="1.5"/>
            <ellipse cx="256" cy="438" rx="90" ry="20" fill="#000000" opacity="0.85" filter="blur(5px)"/>

            <!-- Steppe Nomad Horse Archer Heroic Full Stance -->
            <!-- Soft Felt Steppe Boots -->
            <path d="M 210 370 L 200 435 L 235 435 L 242 375 Z" fill="#365314" stroke="#1a2e05" stroke-width="2"/>
            <path d="M 275 370 L 280 435 L 315 435 L 308 375 Z" fill="#365314" stroke="#1a2e05" stroke-width="2"/>

            <!-- Embroidered Nomad Silk Kaftan with Gold Braiding -->
            <path d="M 195 285 L 180 395 L 330 395 L 315 285 Z" fill="#65a30d" stroke="#3f6212" stroke-width="2.5"/>
            <!-- Leather Nomad Sash with Birchbark Arrow Quiver -->
            <rect x="195" y="275" width="120" height="18" rx="3" fill="#78350f"/>
            <!-- Quiver full of arrows on left hip -->
            <rect x="180" y="240" width="20" height="75" rx="5" fill="#a16207" stroke="#713f12" stroke-width="2" transform="rotate(-15 190 277)"/>

            <!-- DRAWN RECURVE COMPOSITE BOW AIMED FORWARD -->
            <path d="M 330 120 Q 390 220 330 320" stroke="#78350f" stroke-width="7" stroke-linecap="round"/>
            <path d="M 330 120 Q 390 220 330 320" stroke="#facc15" stroke-width="2" stroke-linecap="round"/>
            <!-- Bowstring pulled back to warrior's cheek -->
            <line x1="330" y1="120" x2="250" y2="210" stroke="#f8fafc" stroke-width="1.5"/>
            <line x1="330" y1="320" x2="250" y2="210" stroke="#f8fafc" stroke-width="1.5"/>
            <!-- Nocked Bone-Tipped War Arrow -->
            <line x1="245" y1="210" x2="385" y2="210" stroke="#f8fafc" stroke-width="3"/>
            <polygon points="385,210 375,205 375,215" fill="url(#steelGrad)"/>
            <!-- Falcon Fletching -->
            <polygon points="248,206 258,210 248,214" fill="#65a30d"/>

            <!-- Torso: Hardened Steppe Lamellar Cuirass -->
            <path d="M 210 200 Q 255 190 300 200 L 295 280 Q 255 290 215 280 Z" fill="#4d7c0f" stroke="#1a2e05" stroke-width="2"/>
            <circle cx="235" cy="230" r="4" fill="url(#goldGrad)"/>
            <circle cx="270" cy="230" r="4" fill="url(#goldGrad)"/>
            <circle cx="235" cy="255" r="4" fill="url(#goldGrad)"/>
            <circle cx="270" cy="255" r="4" fill="url(#goldGrad)"/>

            <!-- Small Round Wicker Shield on Back -->
            <ellipse cx="205" cy="230" rx="35" ry="38" fill="#713f12" stroke="#fef08a" stroke-width="3"/>

            <!-- Nomad Head & Wolf-Fur Trimmed Cap with Long Eagle Feather -->
            <ellipse cx="255" cy="155" rx="19" ry="22" fill="#d97706"/>
            <!-- Sharp Nomad Gaze -->
            <circle cx="248" cy="150" r="2.5" fill="#1c1917"/>
            <circle cx="266" cy="150" r="2.5" fill="#1c1917"/>
            <!-- Sleek Mustache -->
            <path d="M 245 160 Q 255 168 268 160" stroke="#1c1917" stroke-width="3" stroke-linecap="round"/>

            <!-- Bozok Fur Hat with Dual Steppe Braids -->
            <path d="M 235 145 Q 255 85 275 145 Z" fill="#84cc16" stroke="#4d7c0f" stroke-width="2"/>
            <ellipse cx="255" cy="145" rx="24" ry="9" fill="#365314"/>
            <!-- Single Eagle Feather Soaring into the Sky -->
            <path d="M 255 90 Q 235 50 230 40 Q 248 55 255 88" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
            <!-- Two Braids on Shoulders -->
            <line x1="235" y1="150" x2="225" y2="190" stroke="#1c1917" stroke-width="4" stroke-linecap="round"/>
            <line x1="275" y1="150" x2="285" y2="190" stroke="#1c1917" stroke-width="4" stroke-linecap="round"/>
        """
    }
}

template = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- 3D Gradients & Filters -->
    <radialGradient id="bgGrad" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="{bg_top}"/>
      <stop offset="100%" stop-color="{bg_bot}"/>
    </radialGradient>
    
    <radialGradient id="pedestalGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="{glow}"/>
      <stop offset="100%" stop-color="{glow}" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="steelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="35%" stop-color="#cbd5e1"/>
      <stop offset="70%" stop-color="#64748b"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>

    <radialGradient id="steelSphere" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#cbd5e1"/>
      <stop offset="80%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </radialGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="80%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>

    <linearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="40%" stop-color="#f97316"/>
      <stop offset="80%" stop-color="#c2410c"/>
      <stop offset="100%" stop-color="#7c2d12"/>
    </linearGradient>

    <linearGradient id="crimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#7f1d1d"/>
    </linearGradient>

    <linearGradient id="swordSteel" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>

    <linearGradient id="helmetGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#e2e8f0"/>
      <stop offset="60%" stop-color="#64748b"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>

    <radialGradient id="shieldLeather" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#92400e"/>
      <stop offset="70%" stop-color="#451a03"/>
      <stop offset="100%" stop-color="#1c1917"/>
    </radialGradient>

    <linearGradient id="woodLogGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#78350f"/>
      <stop offset="50%" stop-color="#451a03"/>
      <stop offset="100%" stop-color="#291107"/>
    </linearGradient>

    <radialGradient id="ironHeadGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#94a3b8"/>
      <stop offset="50%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </radialGradient>

    <radialGradient id="horseCoat" cx="40%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#9a3412"/>
      <stop offset="60%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#3b1606"/>
    </radialGradient>

    <pattern id="chainmailPattern" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="2.5" fill="none" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="3" cy="3" r="1.5" fill="#334155"/>
    </pattern>
  </defs>

  <!-- Atmospheric Background -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  
  <!-- Subtle 3D Spotlight Rays -->
  <polygon points="256,0 160,512 352,512" fill="{glow}" opacity="0.07"/>

  <!-- Character Details -->
  {details}

  <!-- 3D Framing & Badge Overlay -->
  <rect x="8" y="8" width="496" height="496" rx="16" fill="none" stroke="#44403c" stroke-width="2" opacity="0.4"/>
  <rect x="14" y="14" width="484" height="484" rx="12" fill="none" stroke="{glow}" stroke-width="1.5" opacity="0.25"/>

  <!-- Tactical Unit Name Plate at Top -->
  <rect x="116" y="20" width="280" height="34" rx="6" fill="#09090b" fill-opacity="0.85" stroke="#44403c" stroke-width="1.5"/>
  <rect x="118" y="22" width="276" height="30" rx="4" fill="none" stroke="{glow}" stroke-width="1" opacity="0.5"/>
  <text x="256" y="42" font-family="sans-serif" font-size="14" font-weight="bold" fill="#f8fafc" text-anchor="middle" letter-spacing="1">
    {name}
  </text>
  <text x="256" y="495" font-family="monospace" font-size="10" font-weight="bold" fill="{glow}" text-anchor="middle" opacity="0.9" letter-spacing="2">
    ★ 3D MUHAREBE MODELİ ★
  </text>
</svg>
"""

os.makedirs("public/drawable", exist_ok=True)
os.makedirs("public/assets/units", exist_ok=True)
os.makedirs("dist/drawable", exist_ok=True)

for uid, data in units.items():
    svg_content = template.format(
        bg_top=data["bg_top"],
        bg_bot=data["bg_bot"],
        glow=data["glow"],
        details=data["details"],
        name=data["name"].upper()
    )
    
    tmp_svg = f"/tmp/{uid}.svg"
    out_webp1 = f"public/drawable/{uid}.webp"
    out_webp2 = f"public/assets/units/{uid}.webp"
    out_webp3 = f"dist/drawable/{uid}.webp"
    
    with open(tmp_svg, "w") as f:
        f.write(svg_content)
        
    cmd = ["ffmpeg", "-y", "-i", tmp_svg, "-c:v", "libwebp", "-quality", "92", out_webp1]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode == 0:
        # copy to other locations
        import shutil
        shutil.copy(out_webp1, out_webp2)
        shutil.copy(out_webp1, out_webp3)
        print(f"Generated {out_webp1} successfully!")
    else:
        print(f"Failed to generate {uid}: {res.stderr.decode('utf-8')[:200]}")

print("All 10 unit 3D webp assets generated successfully!")
