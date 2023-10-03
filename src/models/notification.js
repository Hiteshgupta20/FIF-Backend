const Promise = require('promise');
const db = require('./../config/pg-db');
const util = require('../controllers/util');
const logger = require('../config/logging');

// methods for auction detail table

module.exports.createNotification = function (data, user) {
    return new Promise(function (resolve, reject) {

        db.query(`INSERT INTO ${db.schema}.t_fcm_notification
             (loginid, title, "desc", "type", imageurl, refid, insertdate, icon,expirydate, contract_url,contractno,flag)
             VALUES($1, $2, $3, $4 ,$5 ,$6, $7,$8,$9,$10,$11,$12) returning *;`,
            [data.loginid, data.title, data.desc, data.type, data.imageurl, data.refid, data.insertDate, data.icon, data.expiryDate, data.contract_url, data.contract_no, data.flag])
            .then(function (result) {

                logger.info("created notification : ", result[0]);
                resolve(result[0]);
            })
            .catch(function (err) {

                logger.error("Error while creating notification : ", err);
                reject(err);
            });
    });
}
module.exports.createNotifications = function (data, user) {
    return new Promise(function (resolve, reject) {

        db.query(`INSERT INTO ${db.schema}.t_fcm_notification
             (loginid, title, "desc", "type", imageurl, refid, insertdate, icon,expiryDate)
             VALUES($1, $2, $3, $4 ,$5 ,$6, $7,$8,$9) returning *;`,
            [user.loginid, data.title, data.desc, data.type, data.imageurl, data.refid, data.insertdate, data.icon, data.expiryDate])
            .then(function (result) {
                logger.info("created notification : ", result[0]);
                resolve(result[0]);
            })
            .catch(function (err) {

                logger.error("Error while creating notification : ", err);
                reject(err);
            });
    });
}

module.exports.createReminderNotificationFrequency = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`INSERT INTO ${db.schema}.t_reminder_notification_frequency
             (activityappid, frequencytype, frequency, days, dates, times, insertdate, insertby)
             VALUES($1, $2, $3, $4 ,$5 ,$6, $7,$8) returning *;`,
            [data.activityAppId, data.frequencyType, data.frequency, data.days,
            data.dates, data.times, data.insertDate, data.insertBy])
            .then(function (result) {
                logger.info("created notification frequency: ", result[0]);
                resolve(result[0]);
            })
            .catch(function (err) {

                logger.error("Error while creating notification frequency : ", err);
                reject(err);
            });
    });
}

module.exports.updateReminderNotificationFrequency = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_reminder_notification_frequency
        set frequencytype = $1, frequency = $2, days = $3, dates = $4,
        times = $5, modifydate = $6, modifyby = $7 where activityappid = $8 returning *;`,
            [data.frequencyType, data.frequency, data.days,
            data.dates, data.times, data.modifyDate, data.modifyBy, data.activityAppId])
            .then(function (result) {
                logger.info("updated notification frequency: ", result[0]);
                resolve(result[0]);
            })
            .catch(function (err) {

                logger.error("Error while updating notification frequency : ", err);
                reject(err);
            });
    });
}

module.exports.getNotificationFrequency = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT *  FROM   ${db.schema}.t_reminder_notification_frequency    
        WHERE activityappid = $1;`,
            [data.activityAppId])
            .then(function (results) {
                let res = results[0] || {};
                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}


module.exports.updateNotification = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_fcm_notification
            SET loginid=$1, title=$2, "desc"=$3, "type"=$4, imageurl=$5, refid=$6, insertdate=$7, icon=$8, expirydate = $10 ,"read"=false, contract_url = $11,contractno= $12,flag= $13
            WHERE loginid=$1 and refid =$6 and type =$9 returning *;`,
            [data.loginid, data.title, data.desc, data.type, data.imageurl, data.refid, data.insertDate, data.icon, data.oldtype, data.expiryDate, data.contract_url, data.contract_no, data.flag])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.updateNotifications = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_fcm_notification
            SET loginid=$1, title=$2, "desc"=$3, "type"=$4, imageurl=$5, refid=$6, insertdate=$7, icon=$8, expirydate = $10 ,"read"=false
            WHERE loginid=$1 and refid =$6 and type =$9 returning *;`,
            [data.loginid, data.title, data.description, data.type, data.imageurl, data.fileid, data.insertDate, data.icon, data.oldtype, data.scheduledate])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.updateNotificationReadStatus = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_fcm_notification
            SET "read"=$1
            WHERE loginid=$2 and refid =$3 and type =$4 returning *;`,
            [data.read, data.userid, data.refid, data.type])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.updateNotificationType = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_fcm_notification
            SET "type"=$1,insertdate = $5
            WHERE loginid=$2 and refid =$3 and type =$4 returning *;`,
            [data.type, data.loginid, data.refid, data.oldtype, data.insertdate])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.updateNotificationExpiryDate = function (refId) {
    return new Promise(function (resolve, reject) {

        db.query(`UPDATE ${db.schema}.t_fcm_notification
            SET expirydate = now()
            WHERE refid =$1 returning *;`,
            [refId])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getNotificationType = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT type  FROM   ${db.schema}.t_fcm_notification    
        WHERE refid = $1 and loginid = $2 
        ORDER BY "insertdate"::timestamp DESC;`,
            [data.refid, data.userid])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.deleteNotification = function (notificationId) {
    return new Promise(function (resolve, reject) {

        db.query(`DELETE FROM ${db.schema}.t_fcm_notification  WHERE id=$1 returning id;`,
            [notificationId])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getNotificationByUserId = function (data) {
    console.log(data)
    return new Promise(function (resolve, reject) {

        db.query(`SELECT id, loginid, title, "desc", "type", imageurl, refid, insertdate, icon, "read" ,expirydate, "contract_url"
        FROM ${db.schema}.t_fcm_notification where "loginid" = $1 AND expirydate >= now() ORDER BY insertdate::timestamp DESC LIMIT $2 OFFSET $3;`,
            [data.loginid, data.limit, data.offset])
            .then(function (results) {
                results.map((data) => {
                    if (data.contract_url == null) {
                        data.contract_url = "";
                    }
                })

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getUnreadNotificationCountByUserId = function (userId) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT count(*) 
        FROM ${db.schema}.t_fcm_notification where "read" = false and loginid = $1;`,
            [userId])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.uploadFile = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`INSERT INTO ${db.schema}.t_nm_excel_schedule
             ( "filepath",loginid, "type", insertdate, scheduledate, "status","title","message")
             VALUES($1, $2, $3, $4 ,$5 ,$6,$7,$8) returning *;`,
            [data.filepath, data.loginid, data.type, data.insertdate, data.scheduledate, data.status, data.title, data.message])
            .then(function (result) {

                logger.info("uploaded file : ", result[0]);
                resolve(result[0]);
            })
            .catch(function (err) {

                logger.error("Error while uploading file : ", err);
                reject(err);
            });
    });
}
module.exports.getAllExcelFiles = function () {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT * FROM ${db.schema}.t_nm_excel_schedule
                  WHERE status = '0' AND scheduledate <= NOW();`, [])
            .then(async function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.getStatusCount = function (fileid) {
    console.log(fileid)
    return new Promise(function (resolve, reject) {
        db.query(`SELECT count(case when status = 'Success' then 'Success' else null end) AS SUCCESS,
        count(case when status = 'Failed' then 'Failed' else null end) AS FAILED 
        FROM fifqa.t_nm_excel_data where fileid=$1;`,
            [fileid])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.updateExcelFileStatus = function (data) {
    return new Promise(function (resolve, reject) {
        //
        db.query(`UPDATE ${db.schema}.t_nm_excel_schedule
                  SET  status = $1 , success = ${data.successCount}, failed = ${data.failedCount}
                  WHERE id=$2 returning *;`,
            [data.status, data.id])
            .then(function (results) {

                resolve(results[0]);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.updateExcelFilesStatus = function (data, response) {
    return new Promise(function (resolve, reject) {
        //
        db.query(`UPDATE ${db.schema}.t_nm_excel_schedule
                  SET  status = $1 , success =$2, failed = $3
                  WHERE id=$4 ;`,
            [data.status, response[0].success, response[0].failed, data.id])
            .then(function (results) {

                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.uploadUserData = function (fileData) {
    return new Promise(function (resolve, reject) {
        db.query(`INSERT INTO ${db.schema}.t_nm_excel_data
        ( fileid,"type", "number", "description", "status",insertdate,scheduledate,"title","message","fcm_token")
        VALUES($1, $2, $3, $4, $5, $6, $7, $8,$9,$10) returning *;`,
            [fileData.fileid, fileData.type, fileData.number, fileData.description, fileData.status,
            fileData.insertdate, fileData.scheduledate, fileData.title, fileData.message, fileData.fcm_token])
            .then(function (result) {
                logger.info("user data uploaded : ", result[0]);
                resolve(result[0]);
            })
            .catch(function (err) {
                logger.error("Error while uploading file : ", err);
                reject(err);
            });
    })
}
module.exports.getuploadedDataCount = function (data) {
    return new Promise(function (resolve, reject) {

        db.query(`SELECT count(*) FROM ${db.schema}.t_nm_excel_schedule ${data.whereClause} ;`, [])
            .then(function (results) {
                resolve(results[0].count);
            })
            .catch(function (err) {
                reject(0);
            });
    });
}
module.exports.getUploadedData = function (data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        db.query(` SELECT * FROM ${db.schema}.t_nm_excel_schedule  ${data.whereClause} ORDER BY id DESC LIMIT $1 OFFSET $2  ;`, [data.limit, data.offset])
            .then(async function (results) {
                let count = await self.getuploadedDataCount(data);
                let response = {
                    "data": results,
                    totalRecords: count
                }
                resolve(response);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

module.exports.getExcelDataById = function (id) {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT * FROM ${db.schema}.t_nm_excel_schedule WHERE id =$1;`, [id])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.deleteUserById = function (id) {
    return new Promise(function (resolve, reject) {
        db.query(`DELETE FROM ${db.schema}.t_nm_excel_schedule WHERE id =$1;`, [id])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.updateExcelDataById = function (id, data) {
    return new Promise(function (resolve, reject) {
        db.query(`UPDATE ${db.schema}.t_nm_excel_schedule 
        SET title=$1, message= $2, scheduledate = $3 WHERE id =$4;`, [data.title, data.message, data.scheduledate, id])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
module.exports.updateNotificationDesc = function (fcm_token, fileid, error) {
    return new Promise(function (resolve, reject) {
        db.query(`UPDATE ${db.schema}.t_nm_excel_data 
        SET status=$1, description = $2 WHERE fcm_token =$3 AND fileid = $4;`, ['Failed', error, fcm_token, fileid])
            .then(function (results) {
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });

    })
}
module.exports.downloadExcel = function (fileid) {
    return new Promise(function (resolve, reject) {
        db.query(`SELECT * FROM ${db.schema}.t_nm_excel_data WHERE fileid = $1 ;`, [fileid])
            .then(function (results) {
                //  console.log(results)
                resolve(results);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}


// module.exports.getCount = function () {
//     return new Promise(function (resolve, reject) {
//         db.query(`SELECT status, COUNT(status) FROM ${db.schema}.t_nm_excel_data GROUP BY status ;`, [])
//             .then(function (results) {
//                 resolve(results);
//             })
//             .catch(function (err) {
//                 reject(err);
//             });
//     })
// }
