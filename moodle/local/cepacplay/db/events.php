<?php
$observers = array(
    array(
        'eventname' => '\mod_quiz\event\attempt_submitted',
        'callback' => 'local_cepacplay_quiz_observer::quiz_completed',
    ),
    array(
        'eventname' => '\mod_forum\event\post_created',
        'callback' => 'local_cepacplay_forum_observer::post_created',
    ),
    array(
        'eventname' => '\mod_assign\event\submission_submitted',
        'callback' => 'local_cepacplay_assign_observer::submission_submitted',
    ),
); 