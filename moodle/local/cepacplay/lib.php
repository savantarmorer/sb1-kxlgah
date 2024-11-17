<?php
function local_cepacplay_send_event($event_data) {
    global $CFG;
    
    // API endpoint of your game
    $game_api = $CFG->wwwroot . '/local/cepacplay/api.php';
    
    $curl = curl_init($game_api);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($event_data));
    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    
    $response = curl_exec($curl);
    curl_close($curl);
    
    return $response;
} 