'use strict';

var AppConstants = {
    creditApplicationBaseUrl: "https://restapi.fifgroup.co.id/fifcrm/",
    fgcBaseUrl: "https://restapi.fifgroup.co.id/",
    crmQaUrl: "https://restapi.fifgroup.co.id/",
    orderTrackingBaseUrl: "https://restapi.fifgroup.co.id/fiforder/",
    fifCRMBaseUrl: "http://103.206.244.11:8084/fifgrouprest-api/",
    fifCRMAuthUrl: "https://authtoken.fifgroup.co.id:9443/auth/realms/fifgroup/protocol/openid-connect/token",
    fifCreditAuthUrl: "https://authtoken.fifgroup.co.id:9443/auth/realms/fifgroup/protocol/openid-connect/token",
    fifFGCAuthUrl: "https://authtoken.fifgroup.co.id:9443/auth/realms/fifgroup/protocol/openid-connect/token",
    imageBasePath: "https://fmc-prod.fifgroup.co.id/",
    fifAstraPayBaseUrl: "https://axway-dev.astrapay.com:8089/api/",
    fifAstraPayTokenBaseUrl: "https://axway-dev.astrapay.com:8065/api/v1/",
    provinceApiUrl: "fifmaster/fifappsdaily/v2/master/prov",
    cityApiUrl: "fifmaster/fifappsdaily/v2/master/cities",
    districtApiUrl: "fifmaster/fifappsdaily/v2/master/kecamatan",
    villageApiUrl: "fifmaster/fifappsdaily/v2/master/kelurahan",

    crmAuthCredentials: {
        authUsername: "360abb90483efb2eabb372c6a3a2a0e4183bcb6e3f3cefed3e9aac19a04911ac09e6f29363bd49f60670b6e2968676dea8be54d4be81147a9ea93b1644eae675",
        authPassword: "gf1a521daf3b303d481add78c3c6ea436dfe14f50b81214b349f58ca15855f4c77e2ab0ec7ee7bf9aa46fb9796ae1406a3f29095544ba940c29e20aa769086b8:cmffif",
        authClientId: "fifgroup-token",
        authClientSecret: "261f1b80-7a18-438e-b9fa-2f9575c97e0b",
        authGrantType: "password"
    },
    astraPayAuthCredentials: {
        authUsername: "FMC_FIFGROUP",
        authPassword: "fmc-fifgroup",
        authClientId: "a04a2f87-c502-4a47-9607-6559c832b60f",
        authClientSecret: "e032dbc5-2962-474c-bf5e-21c28bb81c61",
        authGrantType: "client_credentials"
    },
    fgcAuthCredentials: {
        authUsername: "360abb90483efb2eabb372c6a3a2a0e4183bcb6e3f3cefed3e9aac19a04911ac09e6f29363bd49f60670b6e2968676dea8be54d4be81147a9ea93b1644eae675",
        authPassword: "gf1a521daf3b303d481add78c3c6ea436dfe14f50b81214b349f58ca15855f4c77e2ab0ec7ee7bf9aa46fb9796ae1406a3f29095544ba940c29e20aa769086b8:cmffif",
        authClientId: "fifgroup-token",
        authClientSecret: "261f1b80-7a18-438e-b9fa-2f9575c97e0b",
        authGrantType: "password"
    },
    creditApplicationConstants: {
        docFolder: "cust",
        createdBy: "SYSTEM",
        lat: 0,
        lon: 0,
        officeCode: "00001",
        flagApplication: "CUSTAPP"
    },
    contractStatusMapping: {
        "AC": "Active",
        "PP": "Pre Preterminated",
        "WO": "Write Off",
        "PT": "Pretermination ",
        "CL": "Closed",
        "RP": "Repossesed",
        "CN": "Cancel",
        "PB": "Putback",
        "CR": "Correction"
    },
    bahasaMonths: {
        "00": "Invalid",
        "01": "Januari",
        "02": "Februari",
        "03": "Maret",
        "04": "April",
        "05": "Mei",
        "06": "Juni",
        "07": "Juli",
        "08": "Agustus",
        "09": "September",
        "10": "Oktober",
        "11": "November",
        "12": "Desember"
    },

    latestIosVersion: '2.0.4',
    latestAndroidVersion: '2.0.5',
    fcmServerKey: 'AAAAuj0aEAE:APA91bHNVKQqc2gsa5q3p4IAwhw9-z8CiLrm76ZCiTZl6C9gpNW4zG6axOrKCl-l3AwUzKdzcCDAP0ro2lVVjC1c9uQsudbqmjuYipKGFsNauJDIIk2b4el21b-0sjvbbaZEb6ueycS-'
};

module.exports = AppConstants;