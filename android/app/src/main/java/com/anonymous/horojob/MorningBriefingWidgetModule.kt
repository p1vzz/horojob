package com.anonymous.horojob

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import androidx.core.content.edit
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject

class MorningBriefingWidgetModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "MorningBriefingWidgetModule"

  @ReactMethod
  fun syncMorningBriefing(jsonPayload: String, promise: Promise) {
    try {
      val payload = JSONObject(jsonPayload)
      val metrics = payload.optJSONObject("metrics")
      val plan = payload.optJSONObject("plan")
      val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      prefs.edit {
        putString(KEY_STATE, STATE_READY)
        putString(KEY_HEADLINE, payload.optString("headline", "Morning Career Briefing"))
        putString(KEY_SUMMARY, payload.optString("summary", ""))
        putString(KEY_MODE_LABEL, payload.optString("modeLabel", "Career Mode"))
        putString(KEY_PLAN_HEADLINE, plan?.optString("headline", payload.optString("headline", "")) ?: payload.optString("headline", ""))
        putString(KEY_PRIMARY_ACTION, plan?.optString("primaryAction", payload.optString("summary", "")) ?: payload.optString("summary", ""))
        putString(KEY_PEAK_WINDOW, plan?.optString("peakWindow", "") ?: "")
        putString(KEY_RISK_GUARDRAIL, plan?.optString("riskGuardrail", "") ?: "")
        putInt(KEY_ENERGY, metrics?.optInt("energy", 0) ?: 0)
        putInt(KEY_FOCUS, metrics?.optInt("focus", 0) ?: 0)
        putInt(KEY_LUCK, metrics?.optInt("luck", 0) ?: 0)
        putInt(KEY_AI, metrics?.optInt("aiSynergy", 0) ?: 0)
        putString(KEY_DATE_KEY, payload.optString("dateKey", ""))
        putString(KEY_GENERATED_AT, payload.optString("generatedAt", ""))
        putString(KEY_STALE_AFTER, payload.optString("staleAfter", ""))
      }
      BaseMorningBriefingWidgetProvider.refreshAllWidgets(reactContext)
      promise.resolve(true)
    } catch (error: Throwable) {
      promise.reject("widget_sync_failed", error.message, error)
    }
  }

  @ReactMethod
  fun markLocked(promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      prefs.edit { putString(KEY_STATE, STATE_LOCKED) }
      BaseMorningBriefingWidgetProvider.refreshAllWidgets(reactContext)
      promise.resolve(true)
    } catch (error: Throwable) {
      promise.reject("widget_state_failed", error.message, error)
    }
  }

  @ReactMethod
  fun markProfileMissing(promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      prefs.edit { putString(KEY_STATE, STATE_PROFILE_MISSING) }
      BaseMorningBriefingWidgetProvider.refreshAllWidgets(reactContext)
      promise.resolve(true)
    } catch (error: Throwable) {
      promise.reject("widget_state_failed", error.message, error)
    }
  }

  @ReactMethod
  fun clearWidget(promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      prefs.edit {
        remove(KEY_HEADLINE)
        remove(KEY_SUMMARY)
        remove(KEY_MODE_LABEL)
        remove(KEY_PLAN_HEADLINE)
        remove(KEY_PRIMARY_ACTION)
        remove(KEY_PEAK_WINDOW)
        remove(KEY_RISK_GUARDRAIL)
        remove(KEY_ENERGY)
        remove(KEY_FOCUS)
        remove(KEY_LUCK)
        remove(KEY_AI)
        remove(KEY_DATE_KEY)
        remove(KEY_GENERATED_AT)
        remove(KEY_STALE_AFTER)
        putString(KEY_STATE, STATE_EMPTY)
      }
      BaseMorningBriefingWidgetProvider.refreshAllWidgets(reactContext)
      promise.resolve(true)
    } catch (error: Throwable) {
      promise.reject("widget_clear_failed", error.message, error)
    }
  }

  @ReactMethod
  fun requestPinWidget(promise: Promise) {
    requestPinWidgetForVariant(MorningBriefingWidgetVariant.MEDIUM_VIBE, promise)
  }

  @ReactMethod
  fun requestPinWidgetVariant(variantId: String, promise: Promise) {
    requestPinWidgetForVariant(MorningBriefingWidgetVariant.fromId(variantId), promise)
  }

  private fun requestPinWidgetForVariant(variant: MorningBriefingWidgetVariant, promise: Promise) {
    try {
      val appWidgetManager = AppWidgetManager.getInstance(reactContext)
      if (!appWidgetManager.isRequestPinAppWidgetSupported) {
        promise.resolve(false)
        return
      }
      val component = ComponentName(reactContext, BaseMorningBriefingWidgetProvider.providerClassForVariant(variant))
      val requested = appWidgetManager.requestPinAppWidget(component, null, null)
      promise.resolve(requested)
    } catch (error: Throwable) {
      promise.reject("widget_pin_request_failed", error.message, error)
    }
  }

  @ReactMethod
  fun hasWidgetInstance(promise: Promise) {
    try {
      promise.resolve(BaseMorningBriefingWidgetProvider.hasAnyWidgetInstance(reactContext))
    } catch (error: Throwable) {
      promise.reject("widget_query_failed", error.message, error)
    }
  }

  @ReactMethod
  fun hasWidgetInstanceForVariant(variantId: String, promise: Promise) {
    try {
      val variant = MorningBriefingWidgetVariant.fromId(variantId)
      promise.resolve(BaseMorningBriefingWidgetProvider.hasWidgetInstanceForVariant(reactContext, variant))
    } catch (error: Throwable) {
      promise.reject("widget_query_failed", error.message, error)
    }
  }

  companion object {
    private const val PREFS_NAME = "morning_briefing_widget_prefs"
    private const val KEY_STATE = "state"
    private const val KEY_HEADLINE = "headline"
    private const val KEY_SUMMARY = "summary"
    private const val KEY_MODE_LABEL = "mode_label"
    private const val KEY_PLAN_HEADLINE = "plan_headline"
    private const val KEY_PRIMARY_ACTION = "primary_action"
    private const val KEY_PEAK_WINDOW = "peak_window"
    private const val KEY_RISK_GUARDRAIL = "risk_guardrail"
    private const val KEY_ENERGY = "energy"
    private const val KEY_FOCUS = "focus"
    private const val KEY_LUCK = "luck"
    private const val KEY_AI = "ai"
    private const val KEY_DATE_KEY = "date_key"
    private const val KEY_GENERATED_AT = "generated_at"
    private const val KEY_STALE_AFTER = "stale_after"

    private const val STATE_READY = "ready"
    private const val STATE_LOCKED = "locked"
    private const val STATE_PROFILE_MISSING = "profile_missing"
    private const val STATE_EMPTY = "empty"
  }
}
