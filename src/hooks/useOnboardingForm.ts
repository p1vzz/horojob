import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, InteractionManager, Keyboard } from 'react-native';
import { saveOnboardingForUser } from '../utils/onboardingStorage';
import { clearJobScanHistoryForUser } from '../utils/jobScanHistoryStorage';
import { clearLastJobScanForUser } from '../utils/jobScanStorage';
import { clearSessionJobScansForUser } from '../utils/jobScanSessionCache';
import { upsertBirthProfile } from '../services/astrologyApi';
import { ensureAuthSession } from '../services/authSession';
import { searchCities, type CitySearchItem } from '../services/citiesApi';
import type { AppNavigationProp } from '../types/navigation';
import {
  buildOnboardingSubmitPayload,
  countOnboardingFilledFields,
  formatOnboardingDate,
  formatOnboardingTime,
  isValidOnboardingName,
  normalizeOnboardingNameInput,
  normalizeOnboardingNameValue,
  resolveOnboardingSubmitError,
} from './useOnboardingFormCore';

type OnboardingNavigation = Pick<AppNavigationProp<'Onboarding'>, 'replace'>;

type CityGeoState = {
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  admin1: string | null;
};

const CITY_RESULTS_LIMIT = 6;
const CITY_QUERY_MIN_LENGTH = 2;
const CITY_SEARCH_DEBOUNCE_MS = 280;
const CITY_BLUR_DELAY_MS = 160;

export function useOnboardingForm(navigation: OnboardingNavigation) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [city, setCity] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [citySelected, setCitySelected] = useState(false);
  const [cityGeo, setCityGeo] = useState<CityGeoState | null>(null);
  const [cityResults, setCityResults] = useState<CitySearchItem[]>([]);
  const [cityInputHeight, setCityInputHeight] = useState(56);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());
  const [timeValue, setTimeValue] = useState(new Date());
  const [unknownTime, setUnknownTime] = useState(false);
  const [isCityFocused, setIsCityFocused] = useState(false);
  const [collapseDateTime, setCollapseDateTime] = useState(false);
  const [deferWheelComplete, setDeferWheelComplete] = useState(false);
  const suppressCityFetch = useRef(false);
  const citySelectingRef = useRef(false);
  const citySearchRequestRef = useRef(0);
  const cityBlurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateTimeAnim = useRef(new Animated.Value(1)).current;
  const pageEnter = useRef(new Animated.Value(0)).current;
  const deferredCityQuery = useDeferredValue(cityQuery);

  const clearCityBlurTimeout = () => {
    if (cityBlurTimeoutRef.current) {
      clearTimeout(cityBlurTimeoutRef.current);
      cityBlurTimeoutRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clearCityBlurTimeout();
    },
    []
  );

  const filledCount = useMemo(
    () =>
      countOnboardingFilledFields({
        name,
        birthDate,
        birthTime,
        unknownTime,
        citySelected,
      }),
    [name, birthDate, birthTime, unknownTime, citySelected]
  );
  const isNameValid = useMemo(() => isValidOnboardingName(name), [name]);

  const isComplete = filledCount === 4;
  const wheelFilledCount = deferWheelComplete ? Math.min(filledCount, 3) : filledCount;

  useEffect(() => {
    Animated.timing(pageEnter, {
      toValue: 1,
      duration: 420,
      delay: 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [pageEnter]);

  useEffect(() => {
    if (isCityFocused) {
      setDeferWheelComplete(true);
      Animated.timing(dateTimeAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setCollapseDateTime(true);
        }
      });
      return;
    }

    setCollapseDateTime(false);
    Animated.timing(dateTimeAnim, {
      toValue: 1,
      duration: 360,
      delay: 40,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setDeferWheelComplete(false);
      }
    });
  }, [isCityFocused, dateTimeAnim]);

  useEffect(() => {
    if (suppressCityFetch.current) {
      suppressCityFetch.current = false;
      return;
    }

    const query = deferredCityQuery.trim();
    if (query.length < CITY_QUERY_MIN_LENGTH) {
      startTransition(() => {
        setCityResults([]);
      });
      return;
    }

    let active = true;
    const requestId = citySearchRequestRef.current + 1;
    citySearchRequestRef.current = requestId;

    const timeoutId = setTimeout(() => {
      InteractionManager.runAfterInteractions(async () => {
        try {
          const results = await searchCities(query, { count: CITY_RESULTS_LIMIT, language: 'en' });
          if (!active || requestId !== citySearchRequestRef.current) return;
          startTransition(() => {
            setCityResults(results);
          });
        } catch {
          if (!active || requestId !== citySearchRequestRef.current) return;
          startTransition(() => {
            setCityResults([]);
          });
        }
      });
    }, CITY_SEARCH_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [deferredCityQuery]);

  const handleDateConfirm = (date: Date) => {
    setDateValue(date);
    setBirthDate(formatOnboardingDate(date));
    setShowDatePicker(false);
  };

  const handleTimeConfirm = (date: Date) => {
    setTimeValue(date);
    setBirthTime(formatOnboardingTime(date));
    setShowTimePicker(false);
  };

  const handleUnknownTimeToggle = () => {
    setUnknownTime((prevUnknownTime) => {
      const nextUnknownTime = !prevUnknownTime;
      if (nextUnknownTime) {
        setBirthTime('');
        setShowTimePicker(false);
      }
      return nextUnknownTime;
    });
  };

  const handleCityChange = (text: string) => {
    setCityQuery(text);
    setCity(text);
    setCitySelected(false);
    setCityGeo(null);
  };

  const handleCityFocus = () => {
    clearCityBlurTimeout();
    setIsCityFocused(true);
  };

  const handleCityBlur = () => {
    clearCityBlurTimeout();
    cityBlurTimeoutRef.current = setTimeout(() => {
      if (!citySelectingRef.current) {
        setCityResults([]);
      }
      citySelectingRef.current = false;
      setIsCityFocused(false);
    }, CITY_BLUR_DELAY_MS);
  };

  const handleCitySelect = (selectedCity: CitySearchItem) => {
    citySelectingRef.current = true;
    clearCityBlurTimeout();
    Keyboard.dismiss();
    suppressCityFetch.current = true;
    setIsCityFocused(false);
    setCity(selectedCity.label);
    setCityQuery(selectedCity.label);
    setCitySelected(true);
    setCityGeo({
      latitude: selectedCity.latitude,
      longitude: selectedCity.longitude,
      country: selectedCity.country,
      admin1: selectedCity.admin1,
    });
    setCityResults([]);
  };

  const handleNameChange = (text: string) => {
    setName(normalizeOnboardingNameInput(text));
  };

  const handleNameBlur = () => {
    setName((currentName) => normalizeOnboardingNameValue(currentName));
  };

  const handleSubmit = async () => {
    if (!isComplete) return;
    setSubmitError(null);

    const payload = buildOnboardingSubmitPayload({
      name,
      birthDate,
      birthTime,
      unknownTime,
      city,
      cityGeo,
    });

    try {
      await upsertBirthProfile(payload);
      try {
        const session = await ensureAuthSession();
        clearSessionJobScansForUser(session.user.id);
        await Promise.allSettled([
          saveOnboardingForUser(session.user.id, payload),
          clearLastJobScanForUser(session.user.id),
          clearJobScanHistoryForUser(session.user.id),
        ]);
      } catch {
        // Local cache failure should not block successful onboarding.
      }
      navigation.replace('Dashboard');
    } catch (error) {
      setSubmitError(resolveOnboardingSubmitError(error));
    }
  };

  return {
    name,
    birthDate,
    birthTime,
    city,
    cityQuery,
    cityResults,
    cityInputHeight,
    submitError,
    showDatePicker,
    showTimePicker,
    dateValue,
    timeValue,
    unknownTime,
    citySelected,
    collapseDateTime,
    isCityFocused,
    isNameValid,
    dateTimeAnim,
    pageEnter,
    wheelFilledCount,
    setShowDatePicker,
    setShowTimePicker,
    setCityInputHeight,
    handleNameChange,
    handleNameBlur,
    handleDateConfirm,
    handleTimeConfirm,
    handleUnknownTimeToggle,
    handleCityChange,
    handleCityFocus,
    handleCityBlur,
    handleCitySelect,
    handleSubmit,
  };
}
