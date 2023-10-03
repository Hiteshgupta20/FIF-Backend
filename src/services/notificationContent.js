const Promise = require('promise');;
const util = require('../controllers/util');
const logger = require('../config/logging');
const appConstants = require('../config/appConstants');

//activityName should be same as in activity table for enabling/disabling notification for that particular activity

module.exports.getNotificationContent = function (data) {
    let notificationData = Object.assign({}, data);
    let notificationPoints = notificationData.points || 0;
    switch (notificationData.type) {
        case "AUCTION_SETUP":
            notificationData.title = "Dapatkan ( " + notificationData.title + " ) pada lelang FMC. Dapatkan barang yang sedang dilelang dengan harga yang jauh lebih rendah dari pasaran.";
            notificationData.desc = notificationData.shortdesc || notificationData.desc || "";
            notificationData.activityName = "Auction";
            break;
        case "PAYMENT_CONFIRMATION":
            notificationData.title = "Mohon tunggu, system kami sedang melakukan verifikasi atas pembayaran registrasi proses lelang ( " + notificationData.title + " ) anda.";
            notificationData.desc = notificationData.shortdesc || notificationData.desc || "";
            notificationData.activityName = "Auction";
            break;
        case "PAYMENT_SUBMITTED":
            notificationData.title = "Terima kasih pembayaran atas lelang ( " + notificationData.title + " ) telah kami terima. Pihak kami akan segera menghubungi anda untuk proses selanjutnya.";
            notificationData.desc = notificationData.shortdesc || notificationData.desc || "";
            notificationData.activityName = "Auction";
            break;
        case "PAYMENT_DONE":
            notificationData.title = notificationData.title || "";
            notificationData.desc = notificationData.shortdesc || notificationData.desc || "";
            notificationData.activityName = "Auction";
            break;
        case "AUCTION_REG_VERIFICATION":
            notificationData.title = "Terima kasih, proses registrasi lelang anda telah berhasil. Selamat mengikuti proses lelang .( " + notificationData.title + " )";
            notificationData.desc = notificationData.shortdesc || notificationData.desc || "";
            notificationData.activityName = "Auction";
            break;
        case "AUCTION_REG_CANCELLED":
            notificationData.title = "Cancelled: Pembayaran registrasi lelang  " + notificationData.title + "  telah dicancel. Untuk keterangan lebih lanjut silahkan menghubungi Hallo FIF (1-500-343)";
            notificationData.desc = notificationData.shortdesc || notificationData.desc || "";
            notificationData.activityName = "Auction";
            break;
        case "BIDDING_COMPLETE":
            notificationData.title = "Terima kasih untuk partisipasi anda dalam proses lelang ( " + notificationData.title + " ), nilai bidding anda adalah sebesar Rp " + notificationData.biddingamount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");;
            notificationData.desc = notificationData.shortdesc || notificationData.desc || "";
            notificationData.activityName = "Auction";
            break;
        case "AUCTION_WINNER":
            notificationData.title = "Selamat!!!! Anda telah memenangkan lelang ( " + notificationData.title + " ) dengan nilai Rp " + notificationData.biddingamount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");;
            notificationData.desc = notificationData.shortdesc || notificationData.desc || "";
            notificationData.activityName = "Auction";
            break;
        case "AUCTION_LOSER":
            notificationData.title = "Mohon maaf, anda belum berkesempatan memenangkan lelang ( " + notificationData.title + " ) Raih kesempatan berikutnya di lelang-lelang kami selanjutnya ya.";
            notificationData.desc = notificationData.shortdesc || notificationData.desc || "";
            notificationData.activityName = "Auction";
            break;
        case "AUCTION_REG_REMINDER":
            notificationData.title = "Yuks, jangan lewatkan lelang FMC ( " + notificationData.title + " ). Segera lakukan registrasi dan kami tunggu partisipasi anda.";
            notificationData.desc = notificationData.shortdesc || notificationData.desc || "";
            notificationData.activityName = "Auction";
            break;


        case "PRODUCT_UPLOAD":
            notificationData.title = `Haiiiii.. Ada catalog baru lho di FMC, yukss segera tukarkan point anda sebelum kehabisan yaa..  ${notificationData.productname} : ${notificationData.points} `;
            notificationData.desc = "";
            notificationData.activityName = "Product Catalogue";
            break;
        case "PRODUCT_UPDATE":
            notificationData.title = `Haiiiii.. Ada catalog baru lho di FMC, yukss segera tukarkan point anda sebelum kehabisan yaa.. ${notificationData.productname} : ${notificationData.points} `;
            notificationData.desc = "";
            notificationData.activityName = "Product Catalogue";
            break;

        case "SINATRA_SUBMITTED":
            notificationData.title = "Success!! Terima Kasih, pengajuan Asuransi Sinatra anda telah kami terima. Tim kami akan segera menghubungi anda untuk proses selanjutnya";
            notificationData.desc = "";
            notificationData.activityName = "Request for Sinatra Insurance";
            break;
        case "SINATRA_IN_PROGRESS":
            notificationData.title = "Asuransi Sinatra Update :   Pengajuan Asuransi Sinatra anda saat ini memasuki tahap  status  : IN PROGRESS ";
            notificationData.desc = "";
            notificationData.activityName = "Request for Sinatra Insurance";
            break;
        case "SINATRA_COMPLETED":
            notificationData.title = "Asuransi Sinatra Update :   Pengajuan Asuransi Sinatra anda saat ini memasuki tahap  status : COMPLETED ";
            notificationData.desc = "";
            notificationData.activityName = "Request for Sinatra Insurance";
            break;
        case "SINATRA_CANCELLED":
            notificationData.title = "Asuransi Sinatra Update :   Pengajuan Asuransi Sinatra anda saat ini memasuki tahap status : CANCELLED ";
            notificationData.desc = "";
            notificationData.activityName = "Request for Sinatra Insurance";
            break;

        case "CR_SUBMITTED":
            notificationData.title = `Terima Kasih, anda telah berhasil menukarkan point anda. Mohon tunggu untuk confirmasi status reedem anda selanjutnya. (Product Name: ${notificationData.productName})`;
            notificationData.desc = "";
            notificationData.activityName = "Point Redeem";
            break;

        case "CR_IN_PROGRESS":
            notificationData.title = `Reedem Status Update : Reedem anda untuk ${notificationData.productName} saat ini sudah kami proses.`;
            notificationData.desc = "";
            notificationData.activityName = "Point Redeem";
            break;
        case "CR_COMPLETED":
            notificationData.title = `Selamat, reedem anda untuk ${notificationData.productName} sudah selesai kami proses. Tingkatkan terus point anda dan tunggu catalog terbaru kami.`;
            notificationData.desc = "";
            notificationData.activityName = "Point Redeem";
            break;
        case "CR_CANCELLED":
            notificationData.title = `Mohon maaf, saat ini proses reedem anda telah kami canceled. (Product Name: ${notificationData.productName}).`;
            notificationData.desc = "";
            notificationData.activityName = "Point Redeem";
            break;

        case "STNK_SUBMITTED":
            notificationData.title = `Terima Kasih Permohonan perpanjangan STNK anda telah kami terima. Kami akan segera memberi respon melalui aplikasi dan email untuk proses selanjutnya.`;
            notificationData.desc = "";
            notificationData.activityName = "Request for STNK";
            break;
        case "STNK_IN_PROGRESS":
            notificationData.title = `Informasi perpanjangan STNK : Silahkan datang ke lokasi berikut ini untuk proses selanjutnya ${notificationData.remarks} . Jangan lupa untuk membawa KTP dan STNK asli anda.`;
            notificationData.desc = ``;
            notificationData.activityName = "Request for STNK";
            break;
        case "STNK_COMPLETED":
            notificationData.title = `Terima Kasih, permohonan perpanjangan STNK anda telah selesai kami proses ${notificationData.remarks}. Kami tunggu untuk permohonan anda berikutnya.`;
            notificationData.desc = "";
            notificationData.activityName = "Request for STNK";
            break;
        case "STNK_CANCELLED":
            notificationData.title = `Mohon Maaf, saat ini proses permohonan perpanjangan STNK anda belum dapat kami proses ${notificationData.remarks}. Silahkan hubungi cabang terkait untuk penjelasan lebih lanjut.`;
            notificationData.desc = "";
            notificationData.activityName = "Request for STNK";
            break;

        case "BPKB_SUBMITTED":
            notificationData.title = `Terima Kasih Permohonan BPKB anda telah kami terima. Kami akan segera memberi respon melalui aplikasi dan email untuk proses selanjutnya.`;
            notificationData.desc = "";
            notificationData.activityName = "Request for BPKB";
            break;

        case "BPKB_IN_PROGRESS":
            notificationData.title = `Informasi Permohonan BPKB : Silahkan datang ke lokasi berikut ini untuk proses selanjutnya  ${notificationData.remarks}. Jangan lupa untuk menyertakan KTP pemohon kredit, kwitansi pembayaran terakhir  serta surat kuasa bermatrai 6000 (jika diwakilkan).`;
            notificationData.desc = "";
            notificationData.activityName = "Request for BPKB";
            break;
        case "BPKB_COMPLETED":
            notificationData.title = `Terima Kasih, permohonan atas BPKB anda telah selesai kami proses ${notificationData.remarks}. Kami tunggu untuk permohonan anda berikutnya.`;
            notificationData.desc = "";
            notificationData.activityName = "Request for BPKB";
            break;
        case "BPKB_CANCELLED":
            notificationData.title = `Mohon Maaf, saat ini proses permohonan atas BPKB anda belum dapat kami proses ${notificationData.remarks}. Silahkan hubungi cabang terkait untuk penjelasan lebih lanjut.`;
            notificationData.desc = "";
            notificationData.activityName = "Request for BPKB";
            break;

        case "COMPLAINT_SUBMITTED":
            notificationData.title = `Sukses..Complaint anda berhasil kami kirimkan.`;
            notificationData.desc = "";
            notificationData.activityName = "Complaints";
            break;
        case "COMPLAINT_IN_PROGRESS":
            notificationData.title = `IN PROGRESS: Terima kasih, complaint anda telah kami terima.`;
            notificationData.desc = `${notificationData.remarks}`;
            notificationData.activityName = "Complaints";
            break;
        case "COMPLAINT_COMPLETED":
            notificationData.title = `COMPLETED: Complaint anda telah selesai kami proses.`;
            notificationData.desc = `${notificationData.remarks}`;
            notificationData.activityName = "Complaints";
            break;
        case "COMPLAINT_CANCELLED":
            notificationData.title = `CANCELLED: Complaint anda telah selesai kami proses. `;
            notificationData.desc = `${notificationData.remarks}`;
            notificationData.activityName = "Complaints";
            break;

        //Change_Ownership
        case "CO_SUBMITTED":
            notificationData.title = "CO_IN_PROGRESS - title";
            notificationData.desc = "CO_IN_PROGRESS - desc";
            notificationData.activityName = "Request for Change Ownership";
            break;
        case "CO_IN_PROGRESS":
            notificationData.title = "CO_IN_PROGRESS - title";
            notificationData.desc = "CO_IN_PROGRESS - desc";
            notificationData.activityName = "Request for Change Ownership";
            break;
        case "CO_COMPLETED":
            notificationData.title = "CO_COMPLETED - title";
            notificationData.desc = "CO_COMPLETED - desc";
            notificationData.activityName = "Request for Change Ownership";
            break;
        case "CO_CANCELLED":
            notificationData.title = "CO_CANCELLED - title";
            notificationData.desc = "CO_CANCELLED - desc";
            notificationData.activityName = "Request for Change Ownership";
            break;


        //Claim Insurance
        case "CI_SUBMITTED":
            notificationData.title = `Insurance Update..Terima kasih, pengajuan Claim anda sudah kami terima. Mohon tunggu untuk informasi selanjutnya.`;
            notificationData.desc = `${notificationData.remarks}`;
            notificationData.activityName = "Claim Insurance";
            break;
        case "CI_IN_PROGRESS":
            notificationData.title = `Insurance Update...Pengajuan claim Bapak/Ibu saat ini sudah memasuki tahap validasi.`;
            notificationData.desc = `${notificationData.remarks}`;
            notificationData.activityName = "Claim Insurance";
            break;
        case "CI_COMPLETED":
            notificationData.title = `Insurance Update..Selamat, pengajuan claim Bapak/Ibu telah kami setujui.`;
            notificationData.desc = `${notificationData.remarks}`;
            notificationData.activityName = "Claim Insurance";
            break;
        case "CI_CANCELLED":
            notificationData.title = `Insurance Update..Mohon Maaf, pengajuan claim cancelled`;
            notificationData.desc = `${notificationData.remarks}`;
            notificationData.activityName = "Claim Insurance";
            break;


        case "FGC_MEMBER_SUBMIITED":
            notificationData.title = "Pengajuan FIFGROUP CARD anda sudah kami terima, saat ini pengajuan anda sedang masuk tahap verifikasi.";
            notificationData.desc = "";
            notificationData.activityName = "Request New Membership";
            break;
        case "FGC_MEMBER":
            notificationData.title = "Approved Plafond FIFGROUP CARD anda telah diperbaharui sesuai syarat dan ketentuan FIFGROUP CARD yang berlaku.";
            notificationData.desc = "";
            notificationData.activityName = "Request New Membership";
            break;
        case "FGC_MEMBER_REJECTED":
            notificationData.title = "Rejected Mohon maaf pengajuan perubahan plafond FIFGROUP CARD Anda belum disetujui.";
            notificationData.desc = "";
            notificationData.activityName = "Request New Membership";
            break;
        case "FGC_UPGRADE_SUBMITTED":
            notificationData.title = "Pengajuan perubahan plafond FIFGROUP CARD anda sudah kami terima, dan masuk dalam tahap verifikasi. FIFGROUP berhak menentukan besaran plafond FIFGROUP CARD sesuai syarat dan ketentuan yang berlaku.";
            notificationData.desc = "";
            notificationData.activityName = "Upgrade Membership";
            break;
        case "FGC_UPGRADE_APPROVED":
            notificationData.title = `Approved Plafond FIFGROUP CARD anda telah diperbaharui sesuai syarat dan ketentuan FIFGROUP CARD yang berlaku. Available balance anda menjadi Rp. ${notificationData.availableBalance}`;
            notificationData.desc = "";
            notificationData.activityName = "Upgrade Membership";
            break;
        case "FGC_UPGRADE_REJECTED":
            notificationData.title = `Rejected Mohon maaf pengajuan perubahan plafond FIFGROUP CARD Anda belum disetujui. Avalaible balance FIFGROUP CARD anda saat ini adalah Rp. ${notificationData.availableBalance}`;
            notificationData.desc = "";
            notificationData.activityName = "Upgrade Membership";
            break;
        case "CREDIT_APPLICATION_SUBMITTED":
            notificationData.title = `Terima kasih, pengajuan kredit anda dengan kategori  ${data.category}, ${data.itemType} telah kami terima.`;
            notificationData.activityName = "Credit Application";
            break;
        case "CREDIT_APPLICATION_PROCESSED":
            notificationData.title = `Pengajuan kredit anda dengan kategori ${data.category}, ${data.itemType} saat ini telah kami proses.`;
            notificationData.activityName = "Credit Application";
            break;
        case "CREDIT_APPLICATION_APPROVED":
            notificationData.title = `Selamat, pengajuan kredit anda dengan kategori ${data.category}, ${data.itemType} telah kami setujui.`;
            notificationData.activityName = "Credit Application";
            break;
        case "CREDIT_APPLICATION_REJECTED":
            notificationData.title = `Mohon maaf, saat ini pengajuan kredit anda dengan kategori ${data.category}, ${data.itemType} belum dapat kami setujui. Silahkan hubungi kantor cabang kami untuk informasi lebih lanjut.`;
            notificationData.activityName = "Credit Application";
            break;
        case "CREDIT_APPLICATION_CANCELED":
            notificationData.title = `Pengajuan kredit anda dengan kategori ${data.category}, ${data.itemType} telah kami canceled.`;
            notificationData.activityName = "Credit Application";
            break;
        case "NEW_SURVEY":
            notificationData.title = "Untuk meningkatkan kualitas layanan dari FIFGROUP, mohon kesediaan Bapak/Ibu untuk megikuti survey singkat dari kami berikut ini";
            notificationData.desc = "Survey" + ":" + notificationData.itemTitle || "";
            notificationData.activityName = "Survey";
            break;
        case "NEW_NEWS":
            notificationData.title = `${notificationData.itemType}: ${notificationData.itemTitle}`;
            notificationData.desc = notificationData.itemType + ":" + notificationData.itemTitle || "";
            notificationData.activityName = "News Promo";
            break;
        case "NEW_PROMO":
            notificationData.title = `${notificationData.itemType}: ${notificationData.itemTitle}`;
            notificationData.desc = notificationData.itemType + ": " + notificationData.itemTitle || "";
            notificationData.activityName = "News Promo";
            break;
        case "UPDATE_PROFILE_REMINDER":
            // notificationData.title = "Lengkapi keterangan pada menu \"Profile\" anda dan dapatkan tambahan point dari kami.";
            notificationData.title = "Segera lakukan update data pada menu profile secara lengkap dan dapatkan " + notificationPoints + " point tambahan.";
            notificationData.desc = "";
            notificationData.activityName = "Update Profile";
            break;
        case "CONNECT_TO_SOCIAL_MEDIA_REMINDER":
            notificationData.title = `Anda belum terhubung dengan akun sosial media Anda. Segera hubungkan akun ${notificationData.desc} Anda dengan aplikasi FMC.`
            notificationData.desc = "";
            notificationData.activityName = "Connect to Social Media";
            break;
        case "CREATE_PASSWORD_REMINDER":
            notificationData.title = "Anda belum membuat kata sandi untuk aplikasi FMC ini. Untuk keamanan, yuks segera lakukan pembuatan kata sandi ya.Masuk ke menu Pengaturan > Ubah Password";
            notificationData.desc = "";
            notificationData.activityName = "Create Password";
            break;
        case "SYNC_CONTRACT_REMINDER":
            notificationData.title = "Anda belum terhubung dengan data contract, segera lakukan sync untuk melihat detail contract anda";
            notificationData.desc = "";
            notificationData.activityName = "Sync Contract";
            break;
        case "COMPLETE_DOCUMENTS_REMINDER":
            // notificationData.title = "Anda belum melakukan penguploadan document, segera lengkapi document anda untuk proses pengajuan yang lebih cepat";
            notificationData.title = "Anda belum melakukan penguploadan document, segera upload semua document anda dan dapatkan " + notificationPoints + " point tambahan.";
            notificationData.desc = "";
            notificationData.activityName = "Documents Completion";
            break;
        case "APP_UPDATE_REMINDER":
            notificationData.title = "Mohon perbaharui aplikasi FIFGROUP MOBILE CUSTOMER anda dengan versi terbaru yang sudah tersedia di App/Playstore.";
            notificationData.desc = "";
            notificationData.activityName = "App Update Reminder";
            break;
        case "INSTALLMENT_PAYMENT_REMINDER_BEFORE":
            notificationData.title = "Jangan lupa, Anda memiliki angsuran yang akan jatuh tempo dalam beberapa hari ";
            notificationData.desc = "";
            notificationData.activityName = "Installment Payment Reminder";
            break;
        case "INSTALLMENT_PAYMENT_REMINDER_AFTER":
            notificationData.title = "Jangan lupa, Anda memiliki angsuran yang sudah jatuh tempo";
            notificationData.desc = "";
            notificationData.activityName = "Installment Payment Reminder";
            break;
        case "STNK BOOKING REMINDER D-1":
            notificationData.title = "Jangan lupa, janji temu untuk perpanjangan STNK anda akan dilaksanakan BESOK! (" + notificationData.bookingdate + ") pada pukul " + notificationData.bookingtime + " di cabang " + notificationData.bookingbranch + "!";
            notificationData.desc = "";
            notificationData.activityName = "Booking Reservation Reminder";
            break;
        case "STNK BOOKING REMINDER D-DAY":
            notificationData.title = "Jangan lupa, janji temu untuk perpanjangan STNK anda akan dilaksanakan HARI INI! (" + notificationData.bookingdate + ") pada pukul " + notificationData.bookingtime + " di cabang " + notificationData.bookingbranch + "!";
            notificationData.desc = "";
            notificationData.activityName = "Booking Reservation Reminder";
            break;
        case "BPKB BOOKING REMINDER D-1":
            notificationData.title = "Jangan lupa, janji temu untuk pengambilan BPKB anda akan dilaksanakan BESOK! (" + notificationData.bookingdate + ") pada pukul " + notificationData.bookingtime + " di cabang " + notificationData.bookingbranch + "!";
            notificationData.desc = "";
            notificationData.activityName = "Booking Reservation Reminder";
            break;
        case "BPKB BOOKING REMINDER D-DAY":
            notificationData.title = "Jangan lupa, janji temu untuk pengambilan BPKB anda akan dilaksanakan HARI INI! (" + notificationData.bookingdate + ") pada pukul " + notificationData.bookingtime + " di cabang " + notificationData.bookingbranch + "!";
            notificationData.desc = "";
            notificationData.activityName = "Booking Reservation Reminder";
            break;
        case "INSTALLMENT_PAYMENT_ON_TIME":
            let paidMonth = notificationData.notificationMonth;
            let paidMonthName = "";
            if (paidMonth) {
                if (paidMonth.length < 2) {
                    paidMonth = '0' + paidMonth;
                }
                paidMonthName = appConstants.bahasaMonths[paidMonth];
            }
            notificationData.title = "Terima kasih, pembayaran angsuran  dan denda anda bulan " + paidMonthName + " untuk nomor kontrak " + notificationData.contractNo + " sebesar Rp " + notificationData.amountPaid + " sudah kami terima pada Tanggal " + notificationData.paidDate + ".";
            notificationData.desc = "";
            notificationData.activityName = "Installment Payment On Time";
            break;
        case "APP_UPLOAD":
            notificationData.title = "Haii FIFers.. Ada apps terbaru lho di FMC,yuks segera buka linknya ya.";
            notificationData.desc = notificationData.itemType + ": " + notificationData.itemTitle || "";
            notificationData.activityName = "Update Profile";
            break;

        case "POINT_REDUCED":
            notificationData.title = "Dear Bapak/Ibu, mohon maaf saat ini point anda akan berkurang sebesar " + notificationData.desc;
            notificationData.desc = "";
            notificationData.activityName = "Points Added";
            break;
        case "POINT_ADDED":
            notificationData.title = "Dear Bapak/Ibu, point anda telah kami tambahkan sebesar " + notificationData.desc;
            notificationData.desc = "";
            notificationData.activityName = "Points Added";
            break;
        case "REGISTER_POINTS_ADDED":
            notificationData.title = "Dear Bapak/Ibu, point anda telah kami tambahkan sebesar " + notificationData.desc;
            notificationData.desc = "";
            notificationData.activityName = "Points Added";
            break;
        case "E_CONTRACT_REMINDER":
            notificationData.title = "Salinan Perjanjian Pembiayaan dengan nomor kontrak " + notificationData.contract_No + " telah tersedia. Klik untuk mengunduh dokumen anda.";
            notificationData.desc = "";
            notificationData.activityName = "E_CONTRACT_REMINDER";
            notificationData.contract_url = notificationData.contract_url;
            break;
        default:
            notificationData.title = "title";
            notificationData.desc = "description";
            notificationData.activityName = "";
    }
    return notificationData;
}


module.exports.getNotificationDetail = function (user, notificationData) {
    console.log(notificationData);
    let data = {};
    let expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 10);
    notificationData = this.getNotificationContent(notificationData);
    let imageUrl = notificationData.imageurl ? notificationData.imageurl[0] : "";
    let date = util.getTimestamp();
    data.loginid = user.loginid;
    data.title = notificationData.title || "";
    data.desc = notificationData.shortdesc || notificationData.desc || "";
    data.type = notificationData.type || "";
    data.oldtype = notificationData.oldtype || "";
    data.imageurl = imageUrl;
    data.refid = notificationData.auctionid || notificationData.refid || notificationData.id || null;
    data.insertDate = date;
    data.expirydate = notificationData.expirydate || expiryDate;
    data.icon = notificationData.icon || "";
    data.contract_url = notificationData.contract_url || "";
    data.contract_no = notificationData.contract_No || "";
    data.flag = notificationData.flag || "";
    logger.info("Notifcation data : ", data);
    return data;
}