/* Assignment 3: Earthquake Visualization
 * CSCI 4611, Fall 2022, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import * as gfx from 'gophergfx'
import { EarthquakeMarker } from './EarthquakeMarker';
import { EarthquakeRecord } from './EarthquakeRecord';

export class Earth extends gfx.Transform3
{
    private earthMesh: gfx.Mesh;
    private earthMaterial: gfx.MorphMaterial;

    public globeMode: boolean;
    public naturalRotation: gfx.Quaternion;
    public mouseRotation: gfx.Quaternion;
    public morphAlpha = 0;

    constructor()
    {
        // Call the superclass constructor
        super();

        this.earthMesh = new gfx.Mesh();
        this.earthMaterial = new gfx.MorphMaterial();

        this.globeMode = false;
        this.naturalRotation = new gfx.Quaternion();
        this.mouseRotation = new gfx.Quaternion();
    }

    public createMesh() : void
    {
        // Initialize texture: you can change to a lower-res texture here if needed
        // Note that this won't display properly until you assign texture coordinates to the mesh
        this.earthMaterial.texture = new gfx.Texture('./assets/earth-2k.png');
        
        // This disables mipmapping, which makes the texture appear sharper
        this.earthMaterial.texture.setMinFilter(true, false);

        // 20x20 is reasonable for a good looking sphere
        // 150x150 is better for height mapping
        //const meshResolution = 10;     
        const meshResolution = 150;

        // A rotation about the Z axis is the earth's axial tilt
        this.naturalRotation.setRotationZ(-23.4 * Math.PI / 180); 
        
        // Precalculated vertices, normals, and triangle indices.
        // After we compute them, we can store them directly in the earthMesh,
        // so they don't need to be member variables.
        const mapVertices: number[] = [];
        const mapNormals: number[] = [];
        const texCoords: number[] = [];
        const indices: number[] = [];
        const globeMapVertices: number[] = [];
        const globeMapNormals: number[] = [];

        const increment = (Math.PI) / meshResolution;
        const numVertices = meshResolution + 1;
        const height = Math.PI/2;

        for(let i = 0; i < numVertices; i++){
            //vertical component
            const vertInc = height - (i * increment);
            for(let j = 0; j < numVertices; j ++){
                //idk why but multiplying by two is necessary to get map bigger
                const inc = -Math.PI + (j * (increment*2));
                mapVertices.push(inc, vertInc, 0);

                const globeVertices = this.convertLatLongToSphere(vertInc, inc, false);

                globeMapVertices.push(globeVertices.x, globeVertices.y, globeVertices.z);

                mapNormals.push(0, 0, 1);

                const normalVec = globeVertices.clone();
                const zeroVec = new gfx.Vector3(0,0,0);
                normalVec.subtract(zeroVec);

                globeMapNormals.push(normalVec.x, normalVec.y, normalVec.z);

                texCoords.push(j/numVertices, (i+1)/numVertices);
            }
        }

        for(let row = 0; row < (meshResolution); row++){
           for(let col = 0; col < meshResolution; col++){
            const point1 = row * numVertices + col;
            const point2 = (row + 1) * numVertices + col;
            const point3 = (row + 1) * numVertices + (col + 1);
            const point4 = row * numVertices + (col+1);
            indices.push(point1, point2, point3);
            indices.push(point4, point1, point3);
           }
        }
        // Set all the earth mesh data
        this.earthMesh.setVertices(mapVertices, true);
        this.earthMesh.setMorphTargetVertices(globeMapVertices);
        this.earthMesh.setMorphTargetNormals(globeMapNormals);
        this.earthMesh.setNormals(mapNormals, true);
        this.earthMesh.setIndices(indices);
        this.earthMesh.setTextureCoordinates(texCoords);
        this.earthMesh.createDefaultVertexColors();
        this.earthMesh.material = this.earthMaterial;

        // Add the mesh to this group
        this.add(this.earthMesh);
    }

    // TO DO: add animations for mesh morphing
    public update(deltaTime: number) : void
    {
        // TO DO
        const morphSpeed = 0.75;

        if(this.globeMode){
            if(this.earthMaterial.morphAlpha < 1 && this.earthMaterial.morphAlpha >= 0){
                this.morphAlpha += deltaTime * morphSpeed;
                this.morphAlpha = gfx.MathUtils.clamp(this.morphAlpha, 0 ,1);
                this.earthMaterial.morphAlpha = this.morphAlpha;

                this.children.forEach((quake: gfx.Transform3) => {
                    if(quake instanceof EarthquakeMarker)
                    {
                        quake.position.lerp(quake.mapPosition, quake.globePosition, this.morphAlpha);
                    }
                });
            }
        }
        if(!this.globeMode){
            if(this.earthMaterial.morphAlpha <= 1 && this.earthMaterial.morphAlpha > 0){
                this.morphAlpha -= deltaTime * morphSpeed;
                this.morphAlpha = gfx.MathUtils.clamp(this.morphAlpha, 0 ,1);
                this.earthMaterial.morphAlpha = this.morphAlpha;

                this.children.forEach((quake: gfx.Transform3) => {
                    if(quake instanceof EarthquakeMarker)
                    {
                        quake.position.lerp(quake.mapPosition, quake.globePosition, this.morphAlpha);
                    }
                });
            }
        }
    }

    public createEarthquake(record: EarthquakeRecord, normalizedMagnitude : number)
    {
        // Number of milliseconds in 1 year (approx.)
        const duration = 12 * 28 * 24 * 60 * 60;

        // TO DO: currently, the earthquake is just placed randomly on the plane
        // You will need to update this code to calculate both the map and globe positions
        //const mapPosition = new gfx.Vector3(Math.random()*6-3, Math.random()*4-2, 0);
        const mapPosition = this.convertLatLongToPlane(record.latitude, record.longitude);
        const globePosition = this.convertLatLongToSphere(record.latitude, record.longitude, true);
        const earthquake = new EarthquakeMarker(mapPosition, globePosition, record, duration, this.globeMode);

        // Initially, the color is set to yellow.
        // You should update this to be more a meaningful representation of the data.
        const quakeColorNum = 1 - 2*((record.magnitude/10)%0.5);
        earthquake.material.setColor(new gfx.Color(1, quakeColorNum, 0));

        this.add(earthquake);
    }

    public animateEarthquakes(currentTime : number)
    {
        // This code removes earthquake markers after their life has expired
        this.children.forEach((quake: gfx.Transform3) => {
            if(quake instanceof EarthquakeMarker)
            {
                const playbackLife = (quake as EarthquakeMarker).getPlaybackLife(currentTime);
                if(playbackLife >= 1)
                {
                    quake.remove();
                }
                else
                {
                    // Global adjustment to reduce the size. You should probably update this be a
                    // more meaningful representation of the earthquake's lifespan.
                    //quake.magnitue * playbacklife
                    const subtractingXY = quake.magnitude * playbackLife;
                    const subtractingZ = 0.5 * playbackLife;
                    quake.scale.set(quake.magnitude - subtractingXY, quake.magnitude - subtractingXY, 0.5 - subtractingZ);
                }
            }
        });
    }

    public convertLatLongToSphere(latitude: number, longitude: number, degrees: boolean) : gfx.Vector3
    {
        // TO DO: We recommend filling in this function to put all your
        // lat,long --> plane calculations in one place.
        if(degrees){
            const latInRad = latitude * (Math.PI/180);
            const longInRad = longitude * (Math.PI/180);

            const x = Math.cos(latInRad) * Math.sin(longInRad);
            const y = Math.sin(latInRad);
            const z = Math.cos(latInRad) * Math.cos(longInRad);

            return new gfx.Vector3(x, y, z);
        }
        else{
            const x = Math.cos(latitude) * Math.sin(longitude);
            const y = Math.sin(latitude);
            const z = Math.cos(latitude) * Math.cos(longitude);
            return new gfx.Vector3(x, y, z);
        }
    }

    public convertLatLongToPlane(latitude: number, longitude: number,) : gfx.Vector3
    {
        // TO DO: We recommend filling in this function to put all your
        // lat,long --> plane calculations in one place.
        const latInRad = latitude * (Math.PI/180);
        const longInRad = longitude * (Math.PI/180);


        return new gfx.Vector3(longInRad, latInRad, 0);
    }

    // This function toggles the wireframe debug mode on and off
    public toggleDebugMode(debugMode : boolean)
    {
        this.earthMaterial.wireframe = debugMode;
    }

    public toggleGlobeMode(globeMode : boolean){
        this.globeMode = globeMode;
    }
}