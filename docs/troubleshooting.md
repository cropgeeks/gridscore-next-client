---
title: GridScore NEXT Troubleshooting FAQ
---

<a href="index.html" class="btn btn-dark">Home</a>

# Troubleshooting FAQ

On this page we'll look at some solutions to issues that have been reported to us by some of our users.

## My trials keep disappearing

On rare occasions, some of our users have reported that they couldn't find their trials when re-opening GridScore. This happened for trials that had been shared/synchronized and those that hadn't. There are a few straightforward reasons why this can happen:

### On-device site data

GridScore saves its data locally in the web browser and will synchronize it with the GridScore server when working on a shared trial. There will always be a local copy of the trial within the browser's storage. By default, browsers will not clear this storage unless the device is about to run out of storage.

However, some users may have configured their browsers to clear local storage when the browser is closed. In other cases, the device used to run GridScore was managed by an institutional IT department which forced this setting to clear storage on closing the browser as well.

If possible, set this to "Allow sites to save data on your device" (might be worded differently). Chrome offers documentation on how to reach this setting: https://support.google.com/chrome/answer/14114868?hl=en-GB&co=GENIE.Platform%3DAndroid

Depending on your platform and the browser you use, the setting might have a different name.

### Safari users

Apple, in their infinite wisdom, decided that web applications (like GridScore) don't need to store information for longer than 7 days as part of their ["Intelligent Tracking Prevention"](https://webkit.org/tracking-prevention/). What this means is that if you use Safari as the default browser on Apple devices (including iPhones and iPads), then Safari may delete your local data (including your trials) after 7 days of inactivity.

Fortunately, there is a simple solution to this! Don't use Safari as the default browser on your data collection device. Install Chrome and set it as the default.

### App vs browser on Android

GridScore, being a web application, can be used directly in the browser, but also, on Android devices, can be installed as a standalone app throught Google Play. While the standalone app still uses the default browser internally to display GridScore, its storage is separate from that of the default browser. This can lead to confusion when trials are set up in one of the two options and then don't show up in the other. So, for example, you have all your trials in the app version, someone then sends you a QR code of another trial that you want to scan and Android automatically opens the browser rather than the installed app to show you the trial and allow you to import it. This new trial will now live in a different place to your original trials.

It's therefore important to either use the installed app or the browser version of GridScore to avoid confusion.

## I can't find the images taken with GridScore

Some users have reported issues with saving images taken through GridScore. By default, GridScore will record the image, then let the browser save it on the users' devices. Depending on the operating system and the used browser, this behaviour can be non-intuitive.

### Samsung with GridScore installed via Google Play

Specifically on Samsung devices with Samsung's own "Samsung Internet" browser users have noticed issues with saving images. The Samsung browser is notorious for its non-standard behaviour and we recommend using Chrome instead. To fully disable the Samsung browser, please follow these steps:

1. Install Chrome
2. Try to uninstall `Samsung Internet` - this may not be possible depending on the device
3. Set Chrome as the [default browser](https://support.google.com/chrome/answer/95417)
4. Go to the Chrome app settings and [change the app permissions] to include:
    - `Camera`
    - `Files` or `Photos and videos`
5. Completely close GridScore from the app switcher
6. Restart GridScore

### iOS

Saving images on iOS devices can sometimes require an additional confirmation step compared to other devices:

After clicking 'Save' on the media window, make sure to properly download the image using the 'Open in...' option before you press 'Done'.

## The on-screen keyboard keeps showing up when selecting a plot and I hate it

When selecting a plot to score, the data entry window shows up and the on-screen keyboard immediately pops up and takes up half the screen. This is GridScore's default behaviour as it automatically focusses the first input of the first trait to speed up data recording. Some users have reported that they'd prefer this didn't happen and the on-screen keyboard only shows up once they've selected an input field. This can be achieved by disabling the `Auto-select first input` setting on the settings page.


<a href="index.html" class="btn btn-dark">Home</a>