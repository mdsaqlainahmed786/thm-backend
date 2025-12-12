"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bank = [
    {
        "name": "Axis Bank Ltd.",
        "ifsc": "UTIB",
        "icon": "public/files/bank/icons/private_sector_banks/bi_axisbank.png",
        "website": "https://www.axisbank.com/"
    },
    {
        "name": "Bandhan Bank Ltd.",
        "ifsc": "BDBL",
        "icon": "public/files/bank/icons/private_sector_banks/bi_bandhanbank.png",
        "website": "https://www.bandhanbank.com/"
    },
    {
        "name": "CSB Bank Limited",
        "ifsc": "CSBK",
        "icon": "public/files/bank/icons/private_sector_banks/bi_csb.png",
        "website": "http://www.csb.co.in/"
    },
    {
        "name": "City Union Bank Ltd.",
        "ifsc": "CIUB",
        "icon": "public/files/bank/icons/private_sector_banks/bi_cityunionbank.png",
        "website": "https://www.cityunionbank.com/"
    },
    {
        "name": "DCB Bank Ltd.",
        "ifsc": "DCBL",
        "icon": "public/files/bank/icons/private_sector_banks/bi_dcbbank.png",
        "website": "https://www.dcbbank.com/"
    },
    {
        "name": "Dhanlaxmi Bank Ltd.",
        "ifsc": "DLXB",
        "icon": "public/files/bank/icons/private_sector_banks/bi_dhanbank.png",
        "website": "https://www.dhanbank.com/"
    },
    {
        "name": "Federal Bank Ltd.",
        "ifsc": "FDRL",
        "icon": "public/files/bank/icons/private_sector_banks/bi_federalbank.png",
        "website": "https://www.federalbank.co.in/"
    },
    {
        "name": "HDFC Bank Ltd.",
        "ifsc": "HDFC",
        "icon": "public/files/bank/icons/private_sector_banks/bi_hdfcbank.png",
        "website": "https://www.hdfcbank.com/"
    },
    {
        "name": "ICICI Bank Ltd.",
        "ifsc": "ICIC",
        "icon": "public/files/bank/icons/private_sector_banks/bi_icicibank.png",
        "website": "https://www.icicibank.com/"
    },
    {
        "name": "IndusInd Bank Ltd.",
        "ifsc": "INDB",
        "icon": "public/files/bank/icons/private_sector_banks/bi_indusind.png",
        "website": "https://www.indusind.com/"
    },
    {
        "name": "IDFC FIRST Bank Limited",
        "ifsc": "IDFB",
        "icon": "public/files/bank/icons/private_sector_banks/bi_idfcbank.png",
        "website": "https://www.idfcbank.com/"
    },
    {
        "name": "Jammu & Kashmir Bank Ltd.",
        "ifsc": "JAKA",
        "icon": "public/files/bank/icons/private_sector_banks/bi_jkbank.png",
        "website": "https://www.jkbank.com/"
    },
    {
        "name": "Karnataka Bank Ltd.",
        "ifsc": "KARB",
        "icon": "public/files/bank/icons/private_sector_banks/bi_karnatakabank.png",
        "website": "https://karnatakabank.com/"
    },
    {
        "name": "Karur Vysya Bank Ltd.",
        "ifsc": "KVBL",
        "icon": "public/files/bank/icons/private_sector_banks/bi_kvb.png",
        "website": "http://www.kvb.co.in/"
    },
    {
        "name": "Kotak Mahindra Bank Ltd.",
        "ifsc": "KKBK",
        "icon": "public/files/bank/icons/private_sector_banks/bi_kotak.png",
        "website": "https://www.kotak.com/"
    },
    {
        "name": "Nainital Bank Ltd.",
        "ifsc": "NTBL",
        "icon": "public/files/bank/icons/private_sector_banks/bi_nainitalbank.png",
        "website": "http://www.nainitalbank.co.in/"
    },
    {
        "name": "RBL Bank Ltd.",
        "ifsc": "RATN",
        "icon": "public/files/bank/icons/private_sector_banks/bi_rblbank.png",
        "website": "https://www.rblbank.com/"
    },
    {
        "name": "South Indian Bank Ltd.",
        "ifsc": "SIBL",
        "icon": "public/files/bank/icons/private_sector_banks/bi_southindianbank.png",
        "website": "https://www.southindianbank.com/"
    },
    {
        "name": "Tamilnad Mercantile Bank Ltd.",
        "ifsc": "TMBL",
        "icon": "public/files/bank/icons/private_sector_banks/bi_tmb.png",
        "website": "http://www.tmb.in/"
    },
    {
        "name": "YES Bank Ltd.",
        "ifsc": "YESB",
        "icon": "public/files/bank/icons/private_sector_banks/bi_yesbank.png",
        "website": "https://www.yesbank.in/"
    },
    {
        "name": "IDBI Bank Limited",
        "ifsc": "IBKL",
        "icon": "public/files/bank/icons/private_sector_banks/bi_idbi.png",
        "website": "https://www.idbi.com/"
    },
    {
        "name": "Coastal Local Area Bank Ltd.",
        "ifsc": "COAS",
        "icon": "public/files/bank/icons/local_area_banks/bi_coastalareabank.png",
        "website": "http://www.coastalareabank.com/"
    },
    {
        "name": "Krishna Bhima Samruddhi LAB Ltd.",
        "ifsc": "KBSX",
        "icon": "public/files/bank/icons/local_area_banks/bi_kbsbankindia.png",
        "website": "http://www.kbsbankindia.com/"
    },
    {
        "name": "Au Small Finance Bank Ltd.",
        "ifsc": "AUBL",
        "icon": "public/files/bank/icons/small_finance_banks/bi_aubank.png",
        "website": "https://www.aubank.in/"
    },
    {
        "name": "Capital Small Finance Bank Ltd.",
        "ifsc": "CLBL",
        "icon": "public/files/bank/icons/small_finance_banks/bi_capitalbank.png",
        "website": "http://www.capitalbank.co.in/"
    },
    {
        "name": "Fincare Small Finance Bank Ltd.",
        "ifsc": "FSFB",
        "icon": "public/files/bank/icons/small_finance_banks/bi_fincarebank.png",
        "website": "http://fincarebank.com/"
    },
    {
        "name": "Equitas Small Finance Bank Ltd.",
        "ifsc": "ESFB",
        "icon": "public/files/bank/icons/small_finance_banks/bi_equitasbank.png",
        "website": "https://www.equitasbank.com/"
    },
    {
        "name": "ESAF Small Finance Bank Ltd.",
        "ifsc": "ESMF",
        "icon": "public/files/bank/icons/small_finance_banks/bi_esafbank.png",
        "website": "https://www.esafbank.com/"
    },
    {
        "name": "Suryoday Small Finance Bank Ltd.",
        "ifsc": "SURY",
        "icon": "public/files/bank/icons/small_finance_banks/bi_suryodaybank.png",
        "website": "https://www.suryodaybank.com/"
    },
    {
        "name": "Ujjivan Small Finance Bank Ltd.",
        "ifsc": "UJVN",
        "icon": "public/files/bank/icons/small_finance_banks/bi_ujjivansfb.png",
        "website": "https://www.ujjivansfb.in/"
    },
    {
        "name": "Utkarsh Small Finance Bank Ltd.",
        "ifsc": "UTKS",
        "icon": "public/files/bank/icons/small_finance_banks/bi_utkarsh.png",
        "website": "https://www.utkarsh.bank/"
    },
    {
        "name": "North East Small Finance Bank Ltd.",
        "ifsc": "NESF",
        "icon": "public/files/bank/icons/small_finance_banks/bi_nesfb.png",
        "website": "https://nesfb.com/"
    },
    {
        "name": "Jana Small Finance Bank Ltd.",
        "ifsc": "JSFB",
        "icon": "public/files/bank/icons/small_finance_banks/bi_janabank.png",
        "website": "https://www.janabank.com/"
    },
    {
        "name": "Shivalik Small Finance Bank Ltd.",
        "ifsc": "SMCB",
        "icon": "public/files/bank/icons/small_finance_banks/bi_shivalikbank.png",
        "website": "https://shivalikbank.com/"
    },
    {
        "name": "Unity Small Finance Bank Ltd.",
        "ifsc": "UNBA",
        "icon": "public/files/bank/icons/small_finance_banks/bi_theunitybank.png",
        "website": "https://theunitybank.com/"
    },
    {
        "name": "Airtel Payments Bank Ltd.",
        "ifsc": "AIRP",
        "icon": "public/files/bank/icons/payments_banks/bi_airtel.png",
        "website": "https://www.airtel.in/bank/"
    },
    {
        "name": "India Post Payments Bank Ltd.",
        "ifsc": "IPOS",
        "icon": "public/files/bank/icons/payments_banks/bi_ippbonline.png",
        "website": "https://ippbonline.com/web/ippb/"
    },
    {
        "name": "FINO Payments Bank Ltd.",
        "ifsc": "FINO",
        "icon": "public/files/bank/icons/payments_banks/bi_finobank.png",
        "website": "https://www.finobank.com/"
    },
    {
        "name": "Paytm Payments Bank Ltd.",
        "ifsc": "PYTM",
        "icon": "public/files/bank/icons/payments_banks/bi_paytmbank.png",
        "website": "http://www.paytmbank.com/"
    },
    {
        "name": "Jio Payments Bank Ltd.",
        "ifsc": "JIOP",
        "icon": "public/files/bank/icons/payments_banks/bi_jiopaymentsbank.png",
        "website": "https://www.jiopaymentsbank.com/"
    },
    {
        "name": "NSDL Payments Bank Limited",
        "ifsc": "NSPB",
        "icon": "public/files/bank/icons/payments_banks/bi_nsdlbank.png",
        "website": "https://nsdlbank.com/"
    },
    {
        "name": "Bank of Baroda",
        "ifsc": "BARB",
        "icon": "public/files/bank/icons/public_sector_banks/bi_bankofbaroda.png",
        "website": "https://www.bankofbaroda.co.in/"
    },
    {
        "name": "Bank of India",
        "ifsc": "BKID",
        "icon": "public/files/bank/icons/public_sector_banks/bi_bankofindia.png",
        "website": "https://www.bankofindia.co.in/"
    },
    {
        "name": "Bank of Maharashtra",
        "ifsc": "MAHB",
        "icon": "public/files/bank/icons/public_sector_banks/bi_bankofmaharashtra.png",
        "website": "https://www.bankofmaharashtra.in/"
    },
    {
        "name": "Canara Bank",
        "ifsc": "CNRB",
        "icon": "public/files/bank/icons/public_sector_banks/bi_canarabank.png",
        "website": "https://www.canarabank.com/"
    },
    {
        "name": "Central Bank of India",
        "ifsc": "CBIN",
        "icon": "public/files/bank/icons/public_sector_banks/bi_centralbankofindia.png",
        "website": "https://www.centralbankofindia.co.in/"
    },
    {
        "name": "Indian Bank",
        "ifsc": "IDIB",
        "icon": "public/files/bank/icons/public_sector_banks/bi_indianbank.png",
        "website": "http://www.indianbank.in/"
    },
    {
        "name": "Indian Overseas Bank",
        "ifsc": "IOBA",
        "icon": "public/files/bank/icons/public_sector_banks/bi_iob.png",
        "website": "https://www.iob.in/"
    },
    {
        "name": "Punjab & Sind Bank",
        "ifsc": "PSIB",
        "icon": "public/files/bank/icons/public_sector_banks/bi_punjabandsindbank.png",
        "website": "https://punjabandsindbank.co.in/"
    },
    {
        "name": "Punjab National Bank",
        "ifsc": "PUNB",
        "icon": "public/files/bank/icons/public_sector_banks/bi_pnbindia.png",
        "website": "https://www.pnbindia.in/"
    },
    {
        "name": "State Bank of India",
        "ifsc": "SBIN",
        "icon": "public/files/bank/icons/public_sector_banks/bi_sbi.png",
        "website": "https://www.sbi.co.in/"
    },
    {
        "name": "UCO Bank",
        "ifsc": "UCBA",
        "icon": "public/files/bank/icons/public_sector_banks/bi_ucobank.png",
        "website": "https://www.ucobank.com/"
    },
    {
        "name": "Union Bank of India",
        "ifsc": "UBIN",
        "icon": "public/files/bank/icons/public_sector_banks/bi_unionbankonline.png",
        "website": "https://www.unionbankonline.co.in/"
    },
    {
        "name": "National Bank for Agriculture and Rural Development",
        "ifsc": "NBRD",
        "icon": "public/files/bank/icons/financial_institutions/bi_nabard.png",
        "website": "http://www.nabard.org/"
    },
    {
        "name": "Export-Import Bank of India",
        "ifsc": "EIBI",
        "icon": "public/files/bank/icons/financial_institutions/bi_eximbankindia.png",
        "website": "https://www.eximbankindia.in/"
    },
    {
        "name": "National Housing Bank",
        "ifsc": "HDFC",
        "icon": "public/files/bank/icons/financial_institutions/bi_nabard.png",
        "website": "https://nhb.org.in/"
    },
    {
        "name": "Small Industries Development Bank of India",
        "ifsc": "SIDB",
        "icon": "public/files/bank/icons/financial_institutions/bi_sidbi.png",
        "website": "https://www.sidbi.in/"
    },
    {
        "name": "Assam Gramin Vikash Bank",
        "ifsc": "AGVX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_agvbank.png",
        "website": "http://www.agvbank.co.in/"
    },
    {
        "name": "Andhra Pradesh Grameena Vikas Bank",
        "ifsc": "APGV",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_apgvbank.png",
        "website": "https://www.apgvbank.in/"
    },
    {
        "name": "Andhra Pragathi Grameena Bank",
        "ifsc": "APGB",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_apgb.png",
        "website": "http://www.apgb.in/"
    },
    {
        "name": "Arunachal Pradesh Rural Bank",
        "ifsc": "APRX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_apruralbank.png",
        "website": "https://www.apruralbank.co.in/"
    },
    {
        "name": "Aryavart Bank",
        "ifsc": "ARYX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_aryavart-rrb.png",
        "website": "http://www.aryavart-rrb.com/"
    },
    {
        "name": "Bangiya Gramin Vikash Bank",
        "ifsc": "BGVX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_bgvb.png",
        "website": "https://bgvb.in/"
    },
    {
        "name": "Baroda Gujarat Gramin Bank",
        "ifsc": "BGGX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_bggb.png",
        "website": "http://www.bggb.in/"
    },
    {
        "name": "Baroda Rajasthan Kshetriya Gramin Bank",
        "ifsc": "BRGX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_brkgb.png",
        "website": "http://www.brkgb.com/"
    },
    {
        "name": "Baroda UP Bank",
        "ifsc": "BUGX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_barodaupbank.png",
        "website": "https://barodaupbank.in/"
    },
    {
        "name": "Chaitanya Godavari GB",
        "ifsc": "CGGX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_cggb.png",
        "website": "http://www.cggb.in/"
    },
    {
        "name": "Chhattisgarh Rajya Gramin Bank",
        "ifsc": "CRGB",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_cgbank.png",
        "website": "http://www.cgbank.in/"
    },
    {
        "name": "Dakshin Bihar Gramin Bank",
        "ifsc": "MBGX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_dbgb.png",
        "website": "http://www.dbgb.in/"
    },
    {
        "name": "Ellaquai Dehati Bank",
        "ifsc": "EDBX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_edb.png",
        "website": "https://www.edb.org.in/"
    },
    {
        "name": "Himachal Pradesh Gramin Bank",
        "ifsc": "HMBX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_hpgb.png",
        "website": "http://www.hpgb.in/"
    },
    {
        "name": "J&K Grameen Bank",
        "ifsc": "XJKG",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_jkgb.png",
        "website": "http://www.jkgb.in/"
    },
    {
        "name": "Jharkhand Rajya Gramin Bank",
        "ifsc": "VGBX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_jrgb.png",
        "website": "http://jrgbank.in/"
    },
    {
        "name": "Karnataka Gramin Bank",
        "ifsc": "PKGB",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_karnatakagraminbank.png",
        "website": "http://www.karnatakagraminbank.com/"
    },
    {
        "name": "Karnataka Vikas Gramin Bank",
        "ifsc": "KVGB",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_kvgbank.png",
        "website": "http://www.kvgbank.com/"
    },
    {
        "name": "Kerala Gramin Bank",
        "ifsc": "KLGB",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_keralagbank.png",
        "website": "http://www.keralagbank.com/"
    },
    {
        "name": "Madhya Pradesh Gramin Bank",
        "ifsc": "CMPX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_mpgb.png",
        "website": "https://mpgb.co.in/"
    },
    {
        "name": "Madhyanchal Gramin Bank",
        "ifsc": "MADX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_mgbank.png",
        "website": "http://www.mgbank.co.in/"
    },
    {
        "name": "Maharashtra Gramin Bank",
        "ifsc": "MAHG",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_mahagramin.png",
        "website": "https://www.mahagramin.in/"
    },
    {
        "name": "Manipur Rural Bank",
        "ifsc": "MRBX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_manipurruralbank.png",
        "website": "http://www.manipurruralbank.com/"
    },
    {
        "name": "Meghalaya Rural Bank",
        "ifsc": "MERX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_meghalayaruralbank.png",
        "website": "http://www.meghalayaruralbank.co.in/"
    },
    {
        "name": "Mizoram Rural Bank",
        "ifsc": "MZRX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_mizoramruralbank.png",
        "website": "https://www.mizoramruralbank.in/"
    },
    {
        "name": "Nagaland Rural Bank",
        "ifsc": "NAGX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_nagalandruralbank.png",
        "website": "http://www.nagalandruralbank.com/"
    },
    {
        "name": "Odisha Gramya Bank",
        "ifsc": "ODGB",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_odishabank.png",
        "website": "http://www.odishabank.in/"
    },
    {
        "name": "Paschim Banga Gramin Bank",
        "ifsc": "PASX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_pbgbank.png",
        "website": "http://www.pbgbank.com/"
    },
    {
        "name": "Prathama U.P. Gramin Bank",
        "ifsc": "SUBX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_prathamaupbank.png",
        "website": "http://www.prathamaupbank.com/"
    },
    {
        "name": "Puduvai Bharathiar Grama Bank",
        "ifsc": "PBGX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_puduvaibharathiargramabank.png",
        "website": "http://www.puduvaibharathiargramabank.in/"
    },
    {
        "name": "Punjab Gramin Bank",
        "ifsc": "PUGX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_pgb.png",
        "website": "http://www.pgb.org.in/"
    },
    {
        "name": "Rajasthan Marudhara Gramin Bank",
        "ifsc": "RMGB",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_rmgb.png",
        "website": "http://www.rmgb.in/"
    },
    {
        "name": "Saptagiri Grameena Bank",
        "ifsc": "SPBX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_saptagirigrameenabank.png",
        "website": "http://www.saptagirigrameenabank.in/"
    },
    {
        "name": "Sarva Haryana Gramin Bank",
        "ifsc": "HGBX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_shgb.png",
        "website": "https://shgb.co.in/"
    },
    {
        "name": "Saurashtra Gramin Bank",
        "ifsc": "SGBA",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_sgbrrb.png",
        "website": "https://sgbrrb.org/"
    },
    {
        "name": "Tamil Nadu Grama Bank",
        "ifsc": "IDIB",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_tamilnadugramabank.png",
        "website": "http://www.tamilnadugramabank.com/"
    },
    {
        "name": "Telangana Grameena Bank",
        "ifsc": "DGBX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_tgbhyd.png",
        "website": "http://www.tgbhyd.in/"
    },
    {
        "name": "Tripura Gramin Bank",
        "ifsc": "TGBX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_tripuragraminbank.png",
        "website": "http://www.tripuragraminbank.org/"
    },
    {
        "name": "Uttar Bihar Gramin Bank",
        "ifsc": "UBGX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_ubgb.png",
        "website": "http://www.ubgb.in/"
    },
    {
        "name": "Utkal Grameen Bank",
        "ifsc": "UGBX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_utkalgrameenbank.png",
        "website": "http://www.utkalgrameenbank.co.in/"
    },
    {
        "name": "Uttarbanga Kshetriya Gramin Bank",
        "ifsc": "UKGX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_ubkgb.png",
        "website": "http://www.ubkgb.org/"
    },
    {
        "name": "Vidharbha Konkan Gramin Bank",
        "ifsc": "BKID",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_vkgb.png",
        "website": "http://www.vkgb.co.in/"
    },
    {
        "name": "Uttarakhand Gramin Bank",
        "ifsc": "UTGX",
        "icon": "public/files/bank/icons/regional_rural_banks/bi_uttarakhandgraminbank.png",
        "website": "http://www.uttarakhandgraminbank.com/"
    },
    {
        "name": "AB Bank Ltd.",
        "ifsc": "ABBL",
        "icon": "public/files/bank/icons/foreign_banks/bi_abbl.png",
        "website": "http://abbl.com/mumbai-branch/"
    },
    {
        "name": "American Express Banking Corporation",
        "ifsc": "XXXX",
        "icon": "public/files/bank/icons/foreign_banks/bi_americanexpress.png",
        "website": "https://www.americanexpress.com/in/"
    },
    {
        "name": "Australia and New Zealand Banking Group Ltd.",
        "ifsc": "ANZB",
        "icon": "public/files/bank/icons/foreign_banks/bi_anz.png",
        "website": "http://www.anz.com/india/en/Corporate/"
    },
    {
        "name": "Barclays Bank Plc.",
        "ifsc": "BARC",
        "icon": "public/files/bank/icons/foreign_banks/bi_barclays.png",
        "website": "https://www.barclays.in/"
    },
    {
        "name": "Bank of America",
        "ifsc": "BOFA",
        "icon": "public/files/bank/icons/foreign_banks/bi_bofa-india.png",
        "website": "http://bofa-india.com/"
    },
    {
        "name": "Bank of Bahrain & Kuwait B.S.C.",
        "ifsc": "BBKM",
        "icon": "public/files/bank/icons/foreign_banks/bi_bbkindia.png",
        "website": "https://www.bbkindia.com/"
    },
    {
        "name": "Bank of Ceylon",
        "ifsc": "BCEY",
        "icon": "public/files/bank/icons/foreign_banks/bi_bankofceylon.png",
        "website": "https://www.boc.lk/"
    },
    {
        "name": "Bank of China",
        "ifsc": "BCHN",
        "icon": "public/files/bank/icons/foreign_banks/bi_bankofchina.png",
        "website": "https://www.bankofchina.com/in/en/aboutus/"
    },
    {
        "name": "Bank of Nova Scotia",
        "ifsc": "NOSC",
        "icon": "public/files/bank/icons/foreign_banks/bi_scotiabank.png",
        "website": "https://www.scotiabank.com/global/en/country/india.html"
    },
    {
        "name": "BNP Paribas",
        "ifsc": "BNPA",
        "icon": "public/files/bank/icons/foreign_banks/bi_bnpparibas.png",
        "website": "http://www.bnpparibas.co.in/en/"
    },
    {
        "name": "Citibank N.A.",
        "ifsc": "CITI",
        "icon": "public/files/bank/icons/foreign_banks/bi_citibank.png",
        "website": "https://www.citibank.co.in/"
    },
    {
        "name": "Cooperatieve Rabobank U.A./ Coöperatieve Centrale Raiffeisen-Boerenleenbank B.A.",
        "ifsc": "RABO",
        "icon": "public/files/bank/icons/foreign_banks/bi_rabobank.png",
        "website": "https://www.rabobank.com/en/locate-us/asia-pacific/india/cooperatieve-rabobank-ua.html"
    },
    {
        "name": "Credit Agricole Corporate & Investment Bank",
        "ifsc": "CRLY",
        "icon": "public/files/bank/icons/foreign_banks/bi_ca-cib.png",
        "website": "https://www.ca-cib.com/our-global-presence/asia-pacific/india/"
    },
    {
        "name": "Credit Suisse AG",
        "ifsc": "CRES",
        "icon": "public/files/bank/icons/foreign_banks/bi_credit-suisse.png",
        "website": "https://www.credit-suisse.com/in/en/investment-banking-apac/investment-banking-in-india/mumbai-bank-branch.htm"
    },
    {
        "name": "CTBC Bank Co., Ltd.",
        "ifsc": "CTCB",
        "icon": "public/files/bank/icons/foreign_banks/bi_chinatrustindia.png",
        "website": "http://www.chinatrustindia.com/"
    },
    {
        "name": "DBS Bank India Limited",
        "ifsc": "DBSS",
        "icon": "public/files/bank/icons/foreign_banks/bi_dbs.png",
        "website": "https://www.dbs.com/india/default.page/"
    },
    {
        "name": "Deutsche Bank A.G.",
        "ifsc": "DEUT",
        "icon": "public/files/bank/icons/foreign_banks/bi_deutschebank.png",
        "website": "http://www.deutschebank.co.in/"
    },
    {
        "name": "Doha Bank Q.P.S.C",
        "ifsc": "DOHB",
        "icon": "public/files/bank/icons/foreign_banks/bi_dohabank.png",
        "website": "http://dohabank.co.in/"
    },
    {
        "name": "Emirates NBD Bank PJSC",
        "ifsc": "EBIL",
        "icon": "public/files/bank/icons/foreign_banks/bi_emiratesnbd.png",
        "website": "https://www.emiratesnbd.co.in/"
    },
    {
        "name": "First Abu Dhabi Bank PJSC",
        "ifsc": "NBAD",
        "icon": "public/files/bank/icons/foreign_banks/bi_bankfab.png",
        "website": "https://www.bankfab.com/en-in/"
    },
    {
        "name": "FirstRand Bank Limited",
        "ifsc": "FIRN",
        "icon": "public/files/bank/icons/foreign_banks/bi_firstrand.png",
        "website": "https://www.firstrand.co.in/"
    },
    {
        "name": "Hong Kong and Shanghai Banking Corporation Limited",
        "ifsc": "HSBC",
        "icon": "public/files/bank/icons/foreign_banks/bi_hsbc.png",
        "website": "https://www.hsbc.co.in/1/2/homepage/"
    },
    {
        "name": "Industrial & Commercial Bank of China Ltd.",
        "ifsc": "ICBK",
        "icon": "public/files/bank/icons/foreign_banks/bi_icbcindia.png",
        "website": "http://www.icbcindia.com/"
    },
    {
        "name": "Industrial Bank of Korea",
        "ifsc": "IBKO",
        "icon": "public/files/bank/icons/foreign_banks/bi_globalibk.png",
        "website": "https://in.globalibk.com/iview/03/CMIBMAN0000/"
    },
    {
        "name": "J.P. Morgan Chase Bank N.A.",
        "ifsc": "CHAS",
        "icon": "public/files/bank/icons/foreign_banks/bi_jpmorgan.png",
        "website": "https://www.jpmorgan.com/IN/en/about-us/"
    },
    {
        "name": "JSC VTB Bank",
        "ifsc": "IBKL",
        "icon": "public/files/bank/icons/foreign_banks/bi_vtbindia.png",
        "website": "http://www.vtbindia.com/"
    },
    {
        "name": "KEB Hana Bank",
        "ifsc": "KOEX",
        "icon": "public/files/bank/icons/foreign_banks/bi_1qbank.png",
        "website": "https://global.1qbank.com/lounge/chennai/et/main.html"
    },
    {
        "name": "Kookmin Bank",
        "ifsc": "KBKB",
        "icon": "public/files/bank/icons/foreign_banks/bi_kbfg.png",
        "website": "https://www.kbfg.com/Eng/about/global/asia/india.jsp/"
    },
    {
        "name": "Krung Thai Bank Public Co. Ltd.",
        "ifsc": "KRTH",
        "icon": "public/files/bank/icons/foreign_banks/bi_krungthai.png",
        "website": "https://krungthai.com/th/content/mumbai-branch/"
    },
    {
        "name": "Mashreq bank PSC",
        "ifsc": "MSHQ",
        "icon": "public/files/bank/icons/foreign_banks/bi_mashreqbank.png",
        "website": "https://www.mashreqbank.com/uae/en/international-banking/network/india/"
    },
    {
        "name": "Mizuho Bank Ltd.",
        "ifsc": "MHCB",
        "icon": "public/files/bank/icons/foreign_banks/bi_mizuhobank.png",
        "website": "https://www.mizuhobank.com/india/index.html"
    },
    {
        "name": "MUFG Bank, Ltd.",
        "ifsc": "BOTM",
        "icon": "public/files/bank/icons/foreign_banks/bi_mufg.png",
        "website": "http://www.bk.mufg.jp/global/globalnetwork/asiaoceania/mumbai.html"
    },
    {
        "name": "NatWest Markets Plc",
        "ifsc": "ABNA",
        "icon": "public/files/bank/icons/foreign_banks/bi_natwestmarkets.png",
        "website": "https://www.natwestmarkets.in/"
    },
    {
        "name": "PT Bank Maybank Indonesia TBK",
        "ifsc": "IBBK",
        "icon": "public/files/bank/icons/foreign_banks/bi_maybank.png",
        "website": "https://www.maybank.co.in/"
    },
    {
        "name": "Qatar National Bank (Q.P.S.C.)",
        "ifsc": "QNBA",
        "icon": "public/files/bank/icons/foreign_banks/bi_qnb.png",
        "website": "https://www.qnb.com/sites/qnb/qnbindia/page/en/en-home.html"
    },
    {
        "name": "Sberbank",
        "ifsc": "SABR",
        "icon": "public/files/bank/icons/foreign_banks/bi_sberbank.png",
        "website": "http://www.sberbank.co.in/"
    },
    {
        "name": "SBM Bank (India) Limited",
        "ifsc": "STCB",
        "icon": "public/files/bank/icons/foreign_banks/bi_sbmbank.png",
        "website": "https://www.sbmbank.co.in/"
    },
    {
        "name": "Shinhan Bank",
        "ifsc": "SHBK",
        "icon": "public/files/bank/icons/foreign_banks/bi_shinhanglobal.png",
        "website": "https://in.shinhanglobal.com/"
    },
    {
        "name": "Societe Generale India",
        "ifsc": "SOGE",
        "icon": "public/files/bank/icons/foreign_banks/bi_societegenerale.png",
        "website": "https://www.societegenerale.asia/en/country-details/country/india-2/"
    },
    {
        "name": "Sonali Bank Ltd.",
        "ifsc": "SBLD",
        "icon": "public/files/bank/icons/foreign_banks/bi_sonalibank.png",
        "website": "http://www.sonalibank.in/"
    },
    {
        "name": "Standard Chartered Bank",
        "ifsc": "SCBL",
        "icon": "public/files/bank/icons/foreign_banks/bi_sc.png",
        "website": "https://www.sc.com/in/"
    },
    {
        "name": "Sumitomo Mitsui Banking Corporation",
        "ifsc": "SMBC",
        "icon": "public/files/bank/icons/foreign_banks/bi_smbc.png",
        "website": "http://www.smbc.co.jp/global/india/"
    },
    {
        "name": "United Overseas Bank Limited",
        "ifsc": "UOVB",
        "icon": "public/files/bank/icons/foreign_banks/bi_uobgroup.png",
        "website": "https://www.uobgroup.com/in/"
    },
    {
        "name": "Woori Bank",
        "ifsc": "HVBK",
        "icon": "public/files/bank/icons/foreign_banks/bi_wooribank.png",
        "website": "https://go.wooribank.com/in/ib/main/IbMain.do"
    }
];
exports.default = Bank;
