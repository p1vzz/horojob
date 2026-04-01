package com.anonymous.horojob

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import androidx.core.content.ContextCompat
import java.text.SimpleDateFormat
import java.util.Locale
import kotlin.math.roundToInt

enum class MorningBriefingWidgetVariant(
  val id: String,
  val layoutResId: Int,
) {
  SMALL_VIBE("small_vibe", R.layout.widget_small_vibe),
  SMALL_SCORE("small_score", R.layout.widget_small_score),
  SMALL_ENERGY_ARC("small_energy_arc", R.layout.widget_small_energy_arc),
  SMALL_ENERGY_VALUE("small_energy_value", R.layout.widget_small_energy_value),
  SMALL_RING_SCORE("small_ring_score", R.layout.widget_small_ring_score),
  MEDIUM_VIBE("medium_vibe", R.layout.widget_medium_vibe),
  STRIP_PEAK("strip_peak", R.layout.widget_strip_peak),
  STRIP_MINIMAL("strip_minimal", R.layout.widget_strip_minimal),
  ;

  companion object {
    fun fromId(raw: String?): MorningBriefingWidgetVariant {
      return values().firstOrNull { it.id == raw } ?: MEDIUM_VIBE
    }
  }
}

abstract class BaseMorningBriefingWidgetProvider : AppWidgetProvider() {
  protected abstract val variant: MorningBriefingWidgetVariant

  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    for (appWidgetId in appWidgetIds) {
      updateSingleWidget(context, appWidgetManager, appWidgetId, variant)
    }
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: android.os.Bundle,
  ) {
    updateSingleWidget(context, appWidgetManager, appWidgetId, variant)
  }

  companion object {
    private const val PREFS_NAME = "morning_briefing_widget_prefs"
    private const val KEY_STATE = "state"
    private const val KEY_HEADLINE = "headline"
    private const val KEY_SUMMARY = "summary"
    private const val KEY_MODE_LABEL = "mode_label"
    private const val KEY_ENERGY = "energy"
    private const val KEY_FOCUS = "focus"
    private const val KEY_LUCK = "luck"
    private const val KEY_AI = "ai"
    private const val KEY_DATE_KEY = "date_key"

    private const val STATE_EMPTY = "empty"
    private const val STATE_READY = "ready"
    private const val STATE_LOCKED = "locked"
    private const val STATE_PROFILE_MISSING = "profile_missing"

    private data class Snapshot(
      val headline: String,
      val summary: String,
      val modeLabel: String,
      val energy: Int,
      val focus: Int,
      val luck: Int,
      val ai: Int,
      val dateKey: String,
    )

    private data class Derived(
      val careerScore: Int,
      val vibeDelta: Int,
      val trendLabel: String,
      val trendLine: String,
      val energyDelta: Int,
      val moonPhase: String,
      val mercuryLabel: String,
      val dateVerbose: String,
      val peakWindow: String,
    )

    private data class PlaceholderCopy(
      val title: String,
      val body: String,
      val foot: String,
    )

    fun refreshAllWidgets(context: Context) {
      for (widgetVariant in MorningBriefingWidgetVariant.values()) {
        refreshWidgetsForVariant(context, widgetVariant)
      }
    }

    fun refreshWidgetsForVariant(context: Context, variant: MorningBriefingWidgetVariant) {
      val appWidgetManager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, providerClassForVariant(variant))
      val widgetIds = appWidgetManager.getAppWidgetIds(component)
      if (widgetIds.isEmpty()) return
      for (widgetId in widgetIds) {
        updateSingleWidget(context, appWidgetManager, widgetId, variant)
      }
    }

    fun hasAnyWidgetInstance(context: Context): Boolean {
      val appWidgetManager = AppWidgetManager.getInstance(context)
      return MorningBriefingWidgetVariant.values().any { variant ->
        val component = ComponentName(context, providerClassForVariant(variant))
        appWidgetManager.getAppWidgetIds(component).isNotEmpty()
      }
    }

    fun hasWidgetInstanceForVariant(context: Context, variant: MorningBriefingWidgetVariant): Boolean {
      val appWidgetManager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, providerClassForVariant(variant))
      return appWidgetManager.getAppWidgetIds(component).isNotEmpty()
    }

    fun providerClassForVariant(variant: MorningBriefingWidgetVariant): Class<out AppWidgetProvider> {
      return when (variant) {
        MorningBriefingWidgetVariant.SMALL_VIBE -> MorningBriefingSmallVibeWidgetProvider::class.java
        MorningBriefingWidgetVariant.SMALL_SCORE -> MorningBriefingSmallScoreWidgetProvider::class.java
        MorningBriefingWidgetVariant.SMALL_ENERGY_ARC -> MorningBriefingSmallEnergyArcWidgetProvider::class.java
        MorningBriefingWidgetVariant.SMALL_ENERGY_VALUE -> MorningBriefingSmallEnergyValueWidgetProvider::class.java
        MorningBriefingWidgetVariant.SMALL_RING_SCORE -> MorningBriefingSmallRingWidgetProvider::class.java
        MorningBriefingWidgetVariant.MEDIUM_VIBE -> MorningBriefingWidgetProvider::class.java
        MorningBriefingWidgetVariant.STRIP_PEAK -> MorningBriefingStripPeakWidgetProvider::class.java
        MorningBriefingWidgetVariant.STRIP_MINIMAL -> MorningBriefingStripMinimalWidgetProvider::class.java
      }
    }

    private fun updateSingleWidget(
      context: Context,
      appWidgetManager: AppWidgetManager,
      appWidgetId: Int,
      variant: MorningBriefingWidgetVariant,
    ) {
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val state = prefs.getString(KEY_STATE, STATE_EMPTY) ?: STATE_EMPTY
      val snapshot = Snapshot(
        headline = prefs.getString(KEY_HEADLINE, "Morning Career Briefing") ?: "Morning Career Briefing",
        summary = prefs.getString(KEY_SUMMARY, "Open Horojob to refresh your insights.") ?: "Open Horojob to refresh your insights.",
        modeLabel = prefs.getString(KEY_MODE_LABEL, "Career Mode") ?: "Career Mode",
        energy = prefs.getInt(KEY_ENERGY, 72).coerceIn(0, 100),
        focus = prefs.getInt(KEY_FOCUS, 69).coerceIn(0, 100),
        luck = prefs.getInt(KEY_LUCK, 74).coerceIn(0, 100),
        ai = prefs.getInt(KEY_AI, 85).coerceIn(0, 100),
        dateKey = prefs.getString(KEY_DATE_KEY, "") ?: "",
      )
      val derived = derive(snapshot)
      val views = RemoteViews(context.packageName, variant.layoutResId)

      if (state == STATE_READY) {
        renderReadyState(context, views, variant, snapshot, derived)
      } else {
        renderPlaceholderState(context, views, variant, state)
      }

      setLaunchIntent(context, views, appWidgetId)
      appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun renderReadyState(
      context: Context,
      views: RemoteViews,
      variant: MorningBriefingWidgetVariant,
      snapshot: Snapshot,
      derived: Derived,
    ) {
      val trendColor = ContextCompat.getColor(
        context,
        if (derived.vibeDelta >= 0) R.color.widget_trend_positive else R.color.widget_trend_negative,
      )
      when (variant) {
        MorningBriefingWidgetVariant.SMALL_VIBE -> {
          safeSetText(views, R.id.widget_vibe_title, "Career Vibe")
          safeSetText(views, R.id.widget_vibe_delta, formatSignedPercent(derived.vibeDelta))
          safeSetText(views, R.id.widget_vibe_trend, derived.trendLine)
          safeSetTextColor(views, R.id.widget_vibe_delta, trendColor)
          safeSetTextColor(views, R.id.widget_vibe_trend, trendColor)
        }

        MorningBriefingWidgetVariant.SMALL_SCORE -> {
          safeSetText(views, R.id.widget_score_value, snapshot.ai.toString())
          safeSetText(views, R.id.widget_score_moon, derived.moonPhase)
          safeSetText(views, R.id.widget_score_mercury, derived.mercuryLabel)
        }

        MorningBriefingWidgetVariant.SMALL_ENERGY_ARC -> {
          safeSetProgress(views, R.id.widget_energy_arc_progress, snapshot.energy)
          safeSetText(views, R.id.widget_energy_arc_value, snapshot.energy.toString())
          safeSetText(views, R.id.widget_energy_arc_delta, "${formatSignedPercent(derived.energyDelta)} from yesterday")
          safeSetTextColor(views, R.id.widget_energy_arc_delta, trendColor)
        }

        MorningBriefingWidgetVariant.SMALL_ENERGY_VALUE -> {
          safeSetText(views, R.id.widget_energy_value_value, "${snapshot.energy} / 100")
        }

        MorningBriefingWidgetVariant.SMALL_RING_SCORE -> {
          safeSetText(views, R.id.widget_ring_score_value, snapshot.ai.toString())
          safeSetProgress(views, R.id.widget_ring_score_progress, snapshot.ai)
        }

        MorningBriefingWidgetVariant.MEDIUM_VIBE -> {
          safeSetText(views, R.id.widget_medium_title, "Today's Career Vibe")
          safeSetText(views, R.id.widget_medium_date, derived.dateVerbose)
          safeSetText(views, R.id.widget_medium_delta, formatSignedPercent(derived.vibeDelta))
          safeSetText(views, R.id.widget_medium_trend, derived.trendLine)
          safeSetText(views, R.id.widget_medium_summary, truncate(snapshot.summary, 120))
          safeSetTextColor(views, R.id.widget_medium_delta, trendColor)
          safeSetTextColor(views, R.id.widget_medium_trend, trendColor)
        }

        MorningBriefingWidgetVariant.STRIP_PEAK -> {
          safeSetText(views, R.id.widget_strip_peak_title, "Career Vibe")
          safeSetText(views, R.id.widget_strip_peak_delta, formatSignedPercent(derived.vibeDelta))
          safeSetText(views, R.id.widget_strip_peak_summary, truncate(snapshot.summary, 48))
          safeSetText(views, R.id.widget_strip_peak_time, derived.peakWindow)
          safeSetTextColor(views, R.id.widget_strip_peak_delta, trendColor)
        }

        MorningBriefingWidgetVariant.STRIP_MINIMAL -> {
          safeSetText(views, R.id.widget_strip_minimal_title, "Career Vibe")
          safeSetText(views, R.id.widget_strip_minimal_delta, formatSignedPercent(derived.vibeDelta))
          safeSetText(views, R.id.widget_strip_minimal_time, derived.peakWindow)
          safeSetTextColor(views, R.id.widget_strip_minimal_delta, trendColor)
        }
      }
    }

    private fun renderPlaceholderState(
      context: Context,
      views: RemoteViews,
      variant: MorningBriefingWidgetVariant,
      state: String,
    ) {
      val copy = placeholderForState(state)
      val mutedColor = ContextCompat.getColor(context, R.color.widget_text_secondary)
      when (variant) {
        MorningBriefingWidgetVariant.SMALL_VIBE -> {
          safeSetText(views, R.id.widget_vibe_title, "Morning Briefing")
          safeSetText(views, R.id.widget_vibe_delta, "--")
          safeSetText(views, R.id.widget_vibe_trend, copy.foot)
          safeSetTextColor(views, R.id.widget_vibe_delta, mutedColor)
          safeSetTextColor(views, R.id.widget_vibe_trend, mutedColor)
        }

        MorningBriefingWidgetVariant.SMALL_SCORE -> {
          safeSetText(views, R.id.widget_score_value, "--")
          safeSetText(views, R.id.widget_score_moon, copy.title)
          safeSetText(views, R.id.widget_score_mercury, copy.foot)
        }

        MorningBriefingWidgetVariant.SMALL_ENERGY_ARC -> {
          safeSetProgress(views, R.id.widget_energy_arc_progress, 0)
          safeSetText(views, R.id.widget_energy_arc_value, "--")
          safeSetText(views, R.id.widget_energy_arc_delta, copy.foot)
          safeSetTextColor(views, R.id.widget_energy_arc_delta, mutedColor)
        }

        MorningBriefingWidgetVariant.SMALL_ENERGY_VALUE -> {
          safeSetText(views, R.id.widget_energy_value_value, "-- / 100")
        }

        MorningBriefingWidgetVariant.SMALL_RING_SCORE -> {
          safeSetText(views, R.id.widget_ring_score_value, "--")
          safeSetProgress(views, R.id.widget_ring_score_progress, 0)
        }

        MorningBriefingWidgetVariant.MEDIUM_VIBE -> {
          safeSetText(views, R.id.widget_medium_title, copy.title)
          safeSetText(views, R.id.widget_medium_date, "")
          safeSetText(views, R.id.widget_medium_delta, "--")
          safeSetText(views, R.id.widget_medium_trend, copy.foot)
          safeSetText(views, R.id.widget_medium_summary, copy.body)
          safeSetTextColor(views, R.id.widget_medium_delta, mutedColor)
          safeSetTextColor(views, R.id.widget_medium_trend, mutedColor)
        }

        MorningBriefingWidgetVariant.STRIP_PEAK -> {
          safeSetText(views, R.id.widget_strip_peak_title, copy.title)
          safeSetText(views, R.id.widget_strip_peak_delta, "--")
          safeSetText(views, R.id.widget_strip_peak_summary, truncate(copy.body, 48))
          safeSetText(views, R.id.widget_strip_peak_time, "--")
          safeSetTextColor(views, R.id.widget_strip_peak_delta, mutedColor)
        }

        MorningBriefingWidgetVariant.STRIP_MINIMAL -> {
          safeSetText(views, R.id.widget_strip_minimal_title, copy.title)
          safeSetText(views, R.id.widget_strip_minimal_delta, "--")
          safeSetText(views, R.id.widget_strip_minimal_time, "--")
          safeSetTextColor(views, R.id.widget_strip_minimal_delta, mutedColor)
        }
      }
    }

    private fun derive(snapshot: Snapshot): Derived {
      val daySeed = snapshot.dateKey.takeLast(2).toIntOrNull() ?: 11
      val vibeDelta = (((snapshot.energy + snapshot.focus + snapshot.ai) / 3f) - 70f).roundToInt().coerceIn(-25, 25)
      val trendLabel = when {
        vibeDelta >= 3 -> "Rising"
        vibeDelta <= -3 -> "Cooling"
        else -> "Steady"
      }
      val trendArrow = when {
        vibeDelta >= 3 -> "↗"
        vibeDelta <= -3 -> "↘"
        else -> "→"
      }
      val energyDelta = (snapshot.energy - (61 + ((snapshot.focus + daySeed) % 19))).coerceIn(-12, 12)
      val moonPhases = listOf("New", "Waxing", "Quarter", "Gibbous", "Full", "Waning")
      val moonPhase = moonPhases[(snapshot.energy + snapshot.focus + snapshot.ai + daySeed) % moonPhases.size]
      val mercuryLabel = if ((snapshot.ai + daySeed) % 5 == 0) "Mercury Rx" else "Mercury Dir"
      val startHour24 = 9 + ((snapshot.energy + snapshot.focus + snapshot.luck + daySeed) % 9)
      val endHour24 = (startHour24 + 2).coerceAtMost(21)
      return Derived(
        careerScore = snapshot.ai.coerceIn(0, 100),
        vibeDelta = vibeDelta,
        trendLabel = trendLabel,
        trendLine = "$trendArrow $trendLabel",
        energyDelta = energyDelta,
        moonPhase = moonPhase,
        mercuryLabel = mercuryLabel,
        dateVerbose = formatDateVerbose(snapshot.dateKey),
        peakWindow = "${to12Hour(startHour24)}-${to12Hour(endHour24)} ${if (endHour24 >= 12) "PM" else "AM"}",
      )
    }

    private fun placeholderForState(state: String): PlaceholderCopy {
      return when (state) {
        STATE_LOCKED -> PlaceholderCopy(
          title = "Premium required",
          body = "Upgrade to Premium to enable Morning Career Briefing widget.",
          foot = "Open Horojob",
        )

        STATE_PROFILE_MISSING -> PlaceholderCopy(
          title = "Profile required",
          body = "Complete birth profile and chart setup to generate briefing.",
          foot = "Open Horojob",
        )

        else -> PlaceholderCopy(
          title = "Morning Career Briefing",
          body = "Open Horojob and sync premium widget data.",
          foot = "Tap to refresh",
        )
      }
    }

    private fun formatDateVerbose(dateKey: String): String {
      if (dateKey.isBlank()) return "Today"
      return try {
        val parser = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val formatter = SimpleDateFormat("EEEE, MMM d", Locale.US)
        val parsed = parser.parse(dateKey)
        if (parsed == null) "Today" else formatter.format(parsed)
      } catch (_: Throwable) {
        "Today"
      }
    }

    private fun to12Hour(hour24: Int): String {
      val normalized = hour24.coerceIn(0, 23)
      val hour = normalized % 12
      return if (hour == 0) "12" else hour.toString()
    }

    private fun setLaunchIntent(context: Context, views: RemoteViews, appWidgetId: Int) {
      val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
      launchIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      val pendingIntent = PendingIntent.getActivity(
        context,
        appWidgetId,
        launchIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
      views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
    }

    private fun safeSetText(views: RemoteViews, viewId: Int, value: CharSequence) {
      try {
        views.setTextViewText(viewId, value)
      } catch (_: Throwable) {
        // no-op when id does not exist in current variant layout
      }
    }

    private fun safeSetTextColor(views: RemoteViews, viewId: Int, color: Int) {
      try {
        views.setTextColor(viewId, color)
      } catch (_: Throwable) {
        // no-op when id does not exist in current variant layout
      }
    }

    private fun safeSetProgress(views: RemoteViews, viewId: Int, progress: Int) {
      try {
        views.setProgressBar(viewId, 100, progress.coerceIn(0, 100), false)
      } catch (_: Throwable) {
        // no-op when id does not exist in current variant layout
      }
    }

    private fun formatSignedPercent(value: Int): String {
      return if (value >= 0) "+$value%" else "$value%"
    }

    private fun truncate(text: String, maxLength: Int): String {
      if (text.length <= maxLength) return text
      return text.take(maxLength - 1).trimEnd() + "…"
    }
  }
}

class MorningBriefingWidgetProvider : BaseMorningBriefingWidgetProvider() {
  override val variant: MorningBriefingWidgetVariant = MorningBriefingWidgetVariant.MEDIUM_VIBE
}

class MorningBriefingSmallVibeWidgetProvider : BaseMorningBriefingWidgetProvider() {
  override val variant: MorningBriefingWidgetVariant = MorningBriefingWidgetVariant.SMALL_VIBE
}

class MorningBriefingSmallScoreWidgetProvider : BaseMorningBriefingWidgetProvider() {
  override val variant: MorningBriefingWidgetVariant = MorningBriefingWidgetVariant.SMALL_SCORE
}

class MorningBriefingSmallEnergyArcWidgetProvider : BaseMorningBriefingWidgetProvider() {
  override val variant: MorningBriefingWidgetVariant = MorningBriefingWidgetVariant.SMALL_ENERGY_ARC
}

class MorningBriefingSmallEnergyValueWidgetProvider : BaseMorningBriefingWidgetProvider() {
  override val variant: MorningBriefingWidgetVariant = MorningBriefingWidgetVariant.SMALL_ENERGY_VALUE
}

class MorningBriefingSmallRingWidgetProvider : BaseMorningBriefingWidgetProvider() {
  override val variant: MorningBriefingWidgetVariant = MorningBriefingWidgetVariant.SMALL_RING_SCORE
}

class MorningBriefingStripPeakWidgetProvider : BaseMorningBriefingWidgetProvider() {
  override val variant: MorningBriefingWidgetVariant = MorningBriefingWidgetVariant.STRIP_PEAK
}

class MorningBriefingStripMinimalWidgetProvider : BaseMorningBriefingWidgetProvider() {
  override val variant: MorningBriefingWidgetVariant = MorningBriefingWidgetVariant.STRIP_MINIMAL
}
