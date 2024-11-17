<?php
class local_cepacplay_quiz_observer {
    public static function quiz_completed(\mod_quiz\event\attempt_submitted $event) {
        $quiz_data = array(
            'type' => 'quiz_completed',
            'userId' => $event->userid,
            'courseId' => $event->courseid,
            'timestamp' => time(),
            'data' => array(
                'score' => $event->get_grade(),
                'maxScore' => $event->get_quiz()->grade
            )
        );
        
        local_cepacplay_send_event($quiz_data);
    }
} 