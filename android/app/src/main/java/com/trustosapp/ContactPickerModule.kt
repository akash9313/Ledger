package com.trustosapp

import android.app.Activity
import android.content.Intent
import android.database.Cursor
import android.provider.ContactsContract
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ContactPickerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pickContactPromise: Promise? = null
    private val PICK_CONTACT_REQUEST = 1009

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "ContactPicker"
    }

    @ReactMethod
    fun pickContact(promise: Promise) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity does not exist")
            return
        }

        pickContactPromise = promise
        try {
            val contactPickerIntent = Intent(
                Intent.ACTION_PICK,
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI
            )
            activity.startActivityForResult(contactPickerIntent, PICK_CONTACT_REQUEST)
        } catch (e: Exception) {
            pickContactPromise?.reject("E_FAILED_TO_SHOW_PICKER", e)
            pickContactPromise = null
        }
    }

    @ReactMethod
    fun getContacts(promise: Promise) {
        val cursor: Cursor? = reactContext.contentResolver.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            arrayOf(
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER
            ),
            null,
            null,
            "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} ASC"
        )

        val contactsList = Arguments.createArray()
        if (cursor != null) {
            val seenNumbers = HashSet<String>()
            val nameIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
            val numberIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)

            while (cursor.moveToNext()) {
                val name = if (nameIdx >= 0) cursor.getString(nameIdx) else ""
                val number = if (numberIdx >= 0) cursor.getString(numberIdx) else ""
                
                val cleanNumber = number.replace(Regex("[^0-9+]"), "")
                if (cleanNumber.isNotEmpty() && !seenNumbers.contains(cleanNumber)) {
                    seenNumbers.add(cleanNumber)
                    val contactMap = Arguments.createMap()
                    contactMap.putString("name", name)
                    contactMap.putString("phoneNumber", number)
                    contactsList.pushMap(contactMap)
                }
            }
            cursor.close()
        }
        promise.resolve(contactsList)
    }

    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode == PICK_CONTACT_REQUEST) {
            if (pickContactPromise != null) {
                if (resultCode == Activity.RESULT_OK && data != null && data.data != null) {
                    val contactUri = data.data
                    val projection = arrayOf(
                        ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                        ContactsContract.CommonDataKinds.Phone.NUMBER
                    )

                    var name = ""
                    var phoneNumber = ""

                    try {
                        val cursor = activity.contentResolver.query(
                            contactUri!!,
                            projection,
                            null,
                            null,
                            null
                        )

                        if (cursor != null && cursor.moveToFirst()) {
                            val nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
                            val numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)

                            if (nameIndex >= 0) {
                                name = cursor.getString(nameIndex) ?: ""
                            }
                            if (numberIndex >= 0) {
                                phoneNumber = cursor.getString(numberIndex) ?: ""
                            }
                            cursor.close()
                        }

                        val result = Arguments.createMap()
                        result.putString("name", name)
                        result.putString("phoneNumber", phoneNumber)
                        pickContactPromise?.resolve(result)
                    } catch (e: Exception) {
                        pickContactPromise?.reject("E_FAILED_TO_READ_CONTACT", e)
                    }
                } else {
                    pickContactPromise?.resolve(null)
                }
                pickContactPromise = null
            }
        }
    }

    override fun onNewIntent(intent: Intent) {}
}
