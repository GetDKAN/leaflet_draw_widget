<?php

use Drupal\DKANExtension\Context\RawDKANContext;

/**
 * Defines application features from the specific context.
 */
class FeatureContext extends RawDKANContext {

  /**
   * Initializes context.
   *
   * Every scenario gets its own context instance.
   * You can also pass arbitrary arguments to the
   * context constructor through behat.yml.
   */
  public function __construct() {
  }

}
